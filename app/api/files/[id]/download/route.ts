import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { Readable } from "stream";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import { drive } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
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

    const { id } = await params;

    const [file] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, id),
          eq(files.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      );
    }

    const driveResponse = await drive.files.get(
      {
        fileId: file.storageKey,
        alt: "media",
      },
      {
        responseType: "stream",
      },
    );

    const nodeStream =
      driveResponse.data as unknown as Readable;

    const webStream = Readable.toWeb(
      nodeStream,
    ) as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type":
          file.mimeType ||
          "application/octet-stream",

        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          file.name,
        )}`,
      },
    });
  } catch (error) {
    console.error(
      "Failed to download file:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}