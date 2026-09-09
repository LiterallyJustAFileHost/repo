import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files, folders } from "@/db/schema";
import {
  drive,
  GOOGLE_DRIVE_FOLDER_ID,
} from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(
  request: Request,
) {
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

    const formData =
      await request.formData();

    const uploadedFile =
      formData.get("file");

    const folderIdValue =
      formData.get("folderId");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 },
      );
    }

    const folderId =
      typeof folderIdValue === "string" &&
      folderIdValue.trim()
        ? folderIdValue.trim()
        : null;

    let driveParentId =
      GOOGLE_DRIVE_FOLDER_ID;

    if (folderId) {
      const [folder] = await db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, folderId),
            eq(
              folders.userId,
              session.user.id,
            ),
          ),
        )
        .limit(1);

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }

      driveParentId =
        folder.storageKey;
    }

    const fileId = randomUUID();
    const shareId = randomUUID();

    const buffer = Buffer.from(
      await uploadedFile.arrayBuffer(),
    );

    const stream =
      Readable.from(buffer);

    const mimeType =
      uploadedFile.type ||
      "application/octet-stream";

    const driveResponse =
      await drive.files.create({
        requestBody: {
          name: uploadedFile.name,
          mimeType,
          parents: [driveParentId],
        },

        media: {
          mimeType,
          body: stream,
        },

        fields:
          "id,name,mimeType,size,createdTime",
      });

    const driveFile =
      driveResponse.data;

    if (!driveFile.id) {
      throw new Error(
        "Google Drive did not return a file ID",
      );
    }

    try {
      const [savedFile] =
        await db
          .insert(files)
          .values({
            id: fileId,
            userId:
              session.user.id,
            folderId,

            name: uploadedFile.name,

            storageKey:
              driveFile.id,

            mimeType,

            size: uploadedFile.size,

            shareId,
          })
          .returning();

      return NextResponse.json(
        {
          file: savedFile,
        },
        { status: 201 },
      );
    } catch (databaseError) {
      /*
       * Prevent an orphaned Drive file if
       * the database insert fails.
       */
      try {
        await drive.files.delete({
          fileId: driveFile.id,
        });
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Drive file:",
          cleanupError,
        );
      }

      throw databaseError;
    }
  } catch (error) {
    console.error(
      "Failed to upload file:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to upload file",
      },
      { status: 500 },
    );
  }
}