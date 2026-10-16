import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { folders } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import {
  drive,
  GOOGLE_DRIVE_FOLDER_ID,
} from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const parentId =
      typeof body.parentId === "string" && body.parentId.trim()
        ? body.parentId.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    if (name.length >= 256) {
      return NextResponse.json(
        { error: "Folder name is too long" },
        { status: 400 },
      );
    }

    let driveParentId = GOOGLE_DRIVE_FOLDER_ID;

    if (parentId) {
      const [parentFolder] = await db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, parentId),
            eq(folders.userId, userId),
          ),
        )
        .limit(1);

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 },
        );
      }

      driveParentId = parentFolder.storageKey;
    }

    const driveResponse = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [driveParentId],
      },
      fields: "id,name,mimeType,createdTime",
    });

    const storageKey = driveResponse.data.id;

    if (!storageKey) {
      throw new Error("Google Drive did not return a folder ID");
    }

    try {
      const [folder] = await db
        .insert(folders)
        .values({
          id: randomUUID(),
          userId,
          name,
          parentId,
          storageKey,
        })
        .returning();

      return NextResponse.json({ folder }, { status: 201 });
    } catch (databaseError) {
      try {
        await drive.files.delete({ fileId: storageKey });
      } catch (cleanupError) {
        console.error("Failed to clean up Drive folder:", cleanupError);
      }

      throw databaseError;
    }
  } catch (error) {
    console.error("Failed to create folder:", error);

    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}