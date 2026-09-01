import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { Readable } from "stream";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import {
  drive,
  GOOGLE_DRIVE_FOLDER_ID,
} from "@/lib/google-drive";

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

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 },
      );
    }

    const fileId = randomUUID();
    const shareId = randomUUID();

    const buffer = Buffer.from(
      await uploadedFile.arrayBuffer(),
    );

    const stream = Readable.from(buffer);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: uploadedFile.name,
        mimeType: uploadedFile.type || "application/octet-stream",
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },

      media: {
        mimeType:
          uploadedFile.type ||
          "application/octet-stream",

        body: stream,
      },

      fields: "id,name,mimeType,size,createdTime",
    });

    const driveFile = driveResponse.data;

    if (!driveFile.id) {
      throw new Error(
        "Google Drive did not return a file ID",
      );
    }

    const [savedFile] = await db
      .insert(files)
      .values({
        id: fileId,
        userId: session.user.id,

        name: uploadedFile.name,

        storageKey: driveFile.id,

        mimeType:
          uploadedFile.type ||
          "application/octet-stream",

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
  } catch (error) {
    console.error("Failed to upload file:", error);

    return NextResponse.json(
      {
        error: "Failed to upload file",
      },
      { status: 500 },
    );
  }
}