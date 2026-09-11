import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ shareId: string }>;
  }
) {
  try {
    const { shareId } = await params;

    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.shareId, shareId))
      .limit(1)

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error("Failed to load shared file:", error);

    return NextResponse.json(
      { error: "Failed to load file" },
      { status: 500 }
    );
  }
}
