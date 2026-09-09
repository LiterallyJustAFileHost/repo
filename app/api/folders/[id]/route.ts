import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files, folders } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 },
      );
    }

    const [folderFiles, subfolders] = await Promise.all([
      db
        .select()
        .from(files)
        .where(
          and(
            eq(files.userId, session.user.id),
            eq(files.folderId, id),
          ),
        )
        .orderBy(desc(files.createdAt)),

      db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.userId, session.user.id),
            eq(folders.parentId, id),
          ),
        )
        .orderBy(desc(folders.createdAt)),
    ]);

    return NextResponse.json({
      folder,
      files: folderFiles,
      folders: subfolders,
    });
  } catch (error) {
    console.error("Failed to load folder:", error);

    return NextResponse.json(
      { error: "Failed to load folder" },
      { status: 500 },
    );
  }
}