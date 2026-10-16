import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { files, folders } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import {
  createResumableUploadSession,
  drive,
  GOOGLE_DRIVE_FOLDER_ID,
} from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  let uploadedDriveFileId: string | undefined;

  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const encodedName = request.headers.get("x-file-name");
    const sizeHeader = request.headers.get("x-file-size");
    const folderIdHeader = request.headers.get("x-folder-id");

    let name: string;

    try {
      name = decodeURIComponent(encodedName ?? "");
    } catch {
      return NextResponse.json(
        { error: "Invalid file name encoding" },
        { status: 400 },
      );
    }

    const size = Number(sizeHeader);
    const mimeType =
      request.headers.get("content-type") ||
      "application/octet-stream";
    const folderId = folderIdHeader?.trim() || null;

    if (
      !name.trim() ||
      name.length > 255 ||
      /[\u0000-\u001f\u007f]/.test(name)
    ) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 },
      );
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      !request.body
    ) {
      return NextResponse.json(
        { error: "Invalid file size or missing file body" },
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

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(size),
      },
      body: request.body,
      duplex: "half",
      cache: "no-store",
    } as RequestInit);

    if (!uploadResponse.ok) {
      const details = await uploadResponse.text();

      console.error(
        "Google Drive upload failed:",
        uploadResponse.status,
        details,
      );

      return NextResponse.json(
        {
          error: `Google Drive upload failed (${uploadResponse.status})`,
        },
        { status: 502 },
      );
    }

    const uploaded = await uploadResponse.json();
    uploadedDriveFileId = uploaded.id;

    if (!uploadedDriveFileId) {
      throw new Error("Google Drive did not return a file ID");
    }

    const verifiedResponse = await drive.files.get({
      fileId: uploadedDriveFileId,
      fields: "id,name,mimeType,size,appProperties",
    });

    const verified = verifiedResponse.data;

    if (
      verified.appProperties?.ljafhUserId !== userId ||
      verified.appProperties?.ljafhFileId !== fileId ||
      !verified.id ||
      !verified.name ||
      !verified.mimeType ||
      verified.size == null ||
      Number(verified.size) !== size
    ) {
      throw new Error("Uploaded file verification failed");
    }

    const [savedFile] = await db
      .insert(files)
      .values({
        id: fileId,
        userId,
        folderId,
        name: verified.name,
        storageKey: verified.id,
        mimeType: verified.mimeType,
        size,
        shareId,
      })
      .returning();

    return NextResponse.json(
      { file: savedFile },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload file:", error);

    if (uploadedDriveFileId) {
      try {
        await drive.files.delete({
          fileId: uploadedDriveFileId,
        });
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Drive file:",
          cleanupError,
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}