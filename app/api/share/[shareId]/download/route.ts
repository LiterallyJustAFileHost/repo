import { user } from "@/auth-schema";
import { db } from "@/db";
import { files } from "@/db/schema";
import { auth } from "@/lib/auth";
import { drive } from "@/lib/google-drive";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
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

    const [result] = await db
      .select({
        file: files,
        ownerSuspended: user.suspended,
      })
      .from(files)
      .innerJoin(user, eq(files.userId, user.id))
      .where(eq(files.shareId, shareId))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      );
    }

    const { file, ownerSuspended } = result;
    const isPublic = file.visibility === "Accessible";

    if (file.visibility !== "Accessible") {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (
        !session ||
        session.user.id !== file.userId ||
        ownerSuspended
      ) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 },
        );
      }
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
        "Cache-Control": isPublic
          ? "public, max-age=0, s-maxage=3600"
          : "private, no-store",
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
