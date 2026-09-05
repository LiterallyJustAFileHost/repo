import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  eq,
  and,
  desc,
  isNull,
} from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  files,
  folders,
} from "@/db/schema";

export async function GET() {
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

    const [userFiles, userFolders] =
      await Promise.all([
        db
          .select({
            id: files.id,
            name: files.name,
            storageKey: files.storageKey,
            mimeType: files.mimeType,
            size: files.size,
            shareId: files.shareId,
            createdAt: files.createdAt,
          })
          .from(files)
          .where(
            and(
              eq(
                files.userId,
                session.user.id,
              ),
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
              eq(
                folders.userId,
                session.user.id,
              ),
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
    console.error(
      "Failed to fetch drive contents:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch drive contents",
      },
      {
        status: 500,
      },
    );
  }
}