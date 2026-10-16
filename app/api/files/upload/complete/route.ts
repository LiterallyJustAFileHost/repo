import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import { drive } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const fileId =
      typeof body.fileId === "string" ? body.fileId : "";
    const driveFileId =
      typeof body.driveFileId === "string" ? body.driveFileId : "";

    if (!fileId || !driveFileId) {
      return NextResponse.json(
        { error: "Missing upload identifiers" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ file: existing });
    }

    const response = await drive.files.get({
      fileId: driveFileId,
      fields: "id,name,mimeType,size,parents,appProperties",
    });

    const uploaded = response.data;
    const properties = uploaded.appProperties;

    if (
      properties?.ljafhUserId !== session.user.id ||
      properties?.ljafhFileId !== fileId ||
      !uploaded.id ||
      !uploaded.name ||
      !uploaded.mimeType ||
      uploaded.size == null
    ) {
      return NextResponse.json(
        { error: "Uploaded file could not be verified" },
        { status: 403 },
      );
    }

    const size = Number(uploaded.size);

    if (!Number.isSafeInteger(size) || size < 0) {
      return NextResponse.json(
        { error: "Invalid uploaded file size" },
        { status: 400 },
      );
    }

    const [savedFile] = await db
      .insert(files)
      .values({
        id: fileId,
        userId: session.user.id,
        folderId:
          typeof body.folderId === "string" ? body.folderId : null,
        name: uploaded.name,
        storageKey: uploaded.id,
        mimeType: uploaded.mimeType,
        size,
        shareId:
          typeof body.shareId === "string" ? body.shareId : "",
      })
      .onConflictDoNothing()
      .returning();

    if (savedFile) {
      return NextResponse.json({ file: savedFile }, { status: 201 });
    }

    const [alreadySaved] = await db
      .select()
      .from(files)
      .where(eq(files.storageKey, uploaded.id))
      .limit(1);

    if (alreadySaved?.userId === session.user.id) {
      return NextResponse.json({ file: alreadySaved });
    }

    return NextResponse.json(
      { error: "Could not save uploaded file" },
      { status: 409 },
    );
  } catch (error) {
    console.error("Failed to finalize upload:", error);

    return NextResponse.json(
      { error: "Could not finish upload" },
      { status: 500 },
    );
  }
}