import { db } from "@/db";
import { files } from "@/db/schema";
import { drive } from "@/lib/google-drive";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  {
    params,
  }: {
      params: Promise<{ shareId: string }>;
  },
) {
  try {
    const { shareId } = await params;

    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.shareId, shareId))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      )
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

    const nodeStream = driveResponse.data as unknown as Readable;
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  } catch (error) {
    console.error("Failed to download shared file:", error);

    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}
