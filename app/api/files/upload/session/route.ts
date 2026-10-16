import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { folders } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import {
  createResumableUploadSession,
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
    const mimeType =
      typeof body.mimeType === "string" && body.mimeType.trim()
        ? body.mimeType.trim()
        : "application/octet-stream";
    const size = body.size;
    const folderId =
      typeof body.folderId === "string" && body.folderId.trim()
        ? body.folderId.trim()
        : null;

    if (
      !name ||
      name.length > 255 ||
      /[\u0000-\u001f\u007f]/.test(name)
    ) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 },
      );
    }

    if (!Number.isSafeInteger(size) || size <= 0) {
      return NextResponse.json(
        { error: "Invalid file size" },
        { status: 400 },
      );
    }

    let parentId = GOOGLE_DRIVE_FOLDER_ID;

    if (folderId) {
      const [folder] = await db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, folderId),
            eq(folders.userId, userId),
          ),
        )
        .limit(1);

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }

      parentId = folder.storageKey;
    }

    const fileId = randomUUID();
    const shareId = randomUUID();

    const uploadUrl = await createResumableUploadSession({
      name,
      mimeType,
      size,
      parentId,
      userId,
      appFileId: fileId,
    });

    return NextResponse.json({
      uploadUrl,
      fileId,
      shareId,
      folderId,
      name,
      mimeType,
      size,
    });
  } catch (error) {
    console.error("Failed to create upload session:", error);

    return NextResponse.json(
      { error: "Could not start upload" },
      { status: 500 },
    );
  }
}