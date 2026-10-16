import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { files, folders } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import { drive } from "@/lib/google-drive";
import { deleteDriveFolderRecursive } from "@/lib/google-drive-cleanup";

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
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const { id } = await params;

    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
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

    const [folderFiles, subfolders] = await Promise.all([
      db
        .select()
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            eq(files.folderId, id),
          ),
        )
        .orderBy(files.createdAt),
      db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            eq(folders.parentId, id),
          ),
        )
        .orderBy(folders.createdAt),
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

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const { id } = await params;
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    if (name.length >= 256) {
      return NextResponse.json(
        { error: "Folder name is too long" },
        { status: 400 },
      );
    }

    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
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

    await drive.files.update({
      fileId: folder.storageKey,
      requestBody: { name },
    });

    const [updatedFolder] = await db
      .update(folders)
      .set({ name })
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, userId),
        ),
      )
      .returning();

    return NextResponse.json({ folder: updatedFolder });
  } catch (error) {
    console.error("Failed to rename folder:", error);

    return NextResponse.json(
      { error: "Failed to rename folder" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const { id } = await params;

    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
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

    await deleteDriveFolderRecursive(folder.storageKey);

    await db
      .delete(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, userId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete folder:", error);

    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}