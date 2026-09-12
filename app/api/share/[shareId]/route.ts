import { user } from "@/auth-schema";
import { db } from "@/db";
import { files } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
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

    const [result] = await db
      .select({
        file: files,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(files)
      .leftJoin(user, eq(files.userId, user.id))
      .where(eq(files.shareId, shareId))
      .limit(1)

    if (!result) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const { file, ownerName, ownerEmail } = result;

    if (file.visibility === "Inaccessible") {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session || session.user.id !== file.userId) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ file, ownerName, ownerEmail });
  } catch (error) {
    console.error("Failed to load shared file:", error);

    return NextResponse.json(
      { error: "Failed to load file" },
      { status: 500 }
    );
  }
}
