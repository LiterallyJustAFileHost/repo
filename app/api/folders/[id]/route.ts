import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files, folders } from "@/db/schema";
import { drive } from "@/lib/google-drive";

export const runtime = "nodejs";

async function deleteDriveFolderRecursive(
  folderId: string,
) {
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken,files(id,mimeType)",
      pageSize: 1000,
      pageToken,
    });

    const children = response.data.files ?? [];

    for (const child of children) {
      if (!child.id) {
        continue;
      }

      if (
        child.mimeType ===
        "application/vnd.google-apps.folder"
      ) {
        await deleteDriveFolderRecursive(
          child.id,
        );
      } else {
        await drive.files.delete({
          fileId: child.id,
        });
      }
    }

    pageToken =
      response.data.nextPageToken ?? undefined;
  } while (pageToken);

  await drive.files.delete({
    fileId: folderId,
  });
}

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

    const [folderFiles, subfolders] =
      await Promise.all([
        db
          .select()
          .from(files)
          .where(
            and(
              eq(
                files.userId,
                session.user.id,
              ),
              eq(files.folderId, id),
            ),
          )
          .orderBy(files.createdAt),

        db
          .select()
          .from(folders)
          .where(
            and(
              eq(
                folders.userId,
                session.user.id,
              ),
              eq(
                folders.parentId,
                id,
              ),
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
    console.error(
      "Failed to load folder:",
      error,
    );

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

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

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

    await drive.files.update({
      fileId: folder.storageKey,
      requestBody: {
        name,
      },
    });

    const [updatedFolder] = await db
      .update(folders)
      .set({
        name,
      })
      .where(
        and(
          eq(folders.id, id),
          eq(
            folders.userId,
            session.user.id,
          ),
        ),
      )
      .returning();

    return NextResponse.json({
      folder: updatedFolder,
    });
  } catch (error) {
    console.error(
      "Failed to rename folder:",
      error,
    );

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

    await deleteDriveFolderRecursive(
      folder.storageKey,
    );
    
    await db
      .delete(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id),
        ),
      );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete folder:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}