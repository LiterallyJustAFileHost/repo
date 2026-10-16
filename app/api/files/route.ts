import { NextResponse } from "next/server";
import {
  eq,
  and,
  desc,
  isNull,
} from "drizzle-orm";

import { db } from "@/db";
import { files, folders } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";

export async function GET() {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;

    const [userFiles, userFolders] = await Promise.all([
      db
        .select({
          id: files.id,
          name: files.name,
          storageKey: files.storageKey,
          mimeType: files.mimeType,
          size: files.size,
          shareId: files.shareId,
          visibility: files.visibility,
          createdAt: files.createdAt,
        })
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            isNull(files.folderId),
          ),
        )
        .orderBy(desc(files.createdAt)),
      db
        .select({
          id: folders.id,
          name: folders.name,
          parentId: folders.parentId,
          createdAt: folders.createdAt,
        })
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            isNull(folders.parentId),
          ),
        )
        .orderBy(desc(folders.createdAt)),
    ]);

    return NextResponse.json({
      files: userFiles,
      folders: userFolders,
    });
  } catch (error) {
    console.error("Failed to fetch drive contents:", error);

    return NextResponse.json(
      { error: "Failed to fetch drive contents" },
      { status: 500 },
    );
  }
}