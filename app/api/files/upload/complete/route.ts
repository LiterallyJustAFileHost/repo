
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq, gt, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { account, user } from "@/auth-schema";
import {
  customQuotas,
  files,
  folders,
  uploadReservations,
} from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import { drive } from "@/lib/google-drive";
import {
  getDefaultQuota,
  QuotaExceededError,
} from "@/lib/quota";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const body = await request.json();

    const fileId =
      typeof body.fileId === "string" ? body.fileId : "";
    const driveFileId =
      typeof body.driveFileId === "string" ? body.driveFileId : "";

    if (!fileId || !driveFileId) {
      return NextResponse.json(
        { error: "Missing upload identifiers" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ file: existing });
    }

    const response = await drive.files.get({
      fileId: driveFileId,
      fields: "id,name,mimeType,size,parents,appProperties",
    });

    const uploaded = response.data;
    const properties = uploaded.appProperties;

    if (
      properties?.ljafhUserId !== userId ||
      properties?.ljafhFileId !== fileId ||
      !uploaded.id ||
      !uploaded.name ||
      !uploaded.mimeType ||
      uploaded.size == null
    ) {
      return NextResponse.json(
        { error: "Uploaded file could not be verified" },
        { status: 403 },
      );
    }

    const size = Number(uploaded.size);

    if (!Number.isSafeInteger(size) || size <= 0) {
      return NextResponse.json(
        { error: "Invalid uploaded file size" },
        { status: 400 },
      );
    }

    const folderId =
      typeof body.folderId === "string" && body.folderId
        ? body.folderId
        : null;

    if (folderId) {
      const [ownedFolder] = await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.id, folderId),
            eq(folders.userId, userId),
          ),
        )
        .limit(1);

      if (!ownedFolder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }
    }

    const savedFile = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`,
      );

      const [reservation] = await tx
        .select()
        .from(uploadReservations)
        .where(
          and(
            eq(uploadReservations.id, fileId),
            eq(uploadReservations.userId, userId),
            gt(uploadReservations.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!reservation) {
        throw new Error("Upload reservation missing or expired");
      }

      if (reservation.sizeBytes !== size) {
        throw new Error("Uploaded size does not match reserved size");
      }

      const [customQuota] = await tx
        .select({ quotaBytes: customQuotas.quotaBytes })
        .from(customQuotas)
        .where(eq(customQuotas.userId, userId))
        .limit(1);

      const [hackClubAccount] = await tx
        .select({ userId: account.userId })
        .from(account)
        .where(
          and(
            eq(account.userId, userId),
            eq(account.providerId, "hackclub"),
          ),
        )
        .limit(1);

      const [userRecord] = await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord) {
        throw new Error("User not found");
      }

      const [usage] = await tx
        .select({
          usedBytes: sql<number>`coalesce(sum(${files.size}), 0)::bigint`,
        })
        .from(files)
        .where(eq(files.userId, userId));

      const [reserved] = await tx
        .select({
          reservedBytes: sql<number>`coalesce(sum(${uploadReservations.sizeBytes}), 0)::bigint`,
        })
        .from(uploadReservations)
        .where(
          and(
            eq(uploadReservations.userId, userId),
            gt(uploadReservations.expiresAt, new Date()),
            ne(uploadReservations.id, fileId),
          ),
        );

      const quotaBytes = Number(
        customQuota?.quotaBytes ??
          getDefaultQuota(Boolean(hackClubAccount)),
      );
      const usedBytes = Number(usage?.usedBytes ?? 0);
      const reservedBytes = Number(reserved?.reservedBytes ?? 0);

      if (usedBytes + reservedBytes + size > quotaBytes) {
        throw new QuotaExceededError(
          quotaBytes,
          usedBytes + reservedBytes,
          size,
        );
      }

      const [saved] = await tx
        .insert(files)
        .values({
          id: fileId,
          userId,
          folderId,
          name: uploaded.name!,
          storageKey: uploaded.id!,
          mimeType: uploaded.mimeType!,
          size,
          shareId:
            typeof body.shareId === "string" && body.shareId
              ? body.shareId
              : randomUUID(),
        })
        .onConflictDoNothing()
        .returning();

      if (!saved) {
        const [alreadySaved] = await tx
          .select()
          .from(files)
          .where(eq(files.storageKey, uploaded.id!))
          .limit(1);

        if (alreadySaved?.userId === userId) {
          await tx
            .delete(uploadReservations)
            .where(
              and(
                eq(uploadReservations.id, fileId),
                eq(uploadReservations.userId, userId),
              ),
            );

          return alreadySaved;
        }

        throw new Error("Could not save uploaded file");
      }

      await tx
        .delete(uploadReservations)
        .where(
          and(
            eq(uploadReservations.id, fileId),
            eq(uploadReservations.userId, userId),
          ),
        );

      return saved;
    });

    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: "Storage quota exceeded",
          quotaBytes: error.quotaBytes,
          usedBytes: error.usedBytes,
          requestedBytes: error.requestedBytes,
        },
        { status: 413 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Uploaded size does not match reserved size"
    ) {
      return NextResponse.json(
        { error: "Uploaded file size does not match the requested size" },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Upload reservation missing or expired"
    ) {
      return NextResponse.json(
        { error: "Upload session expired. Please start the upload again." },
        { status: 409 },
      );
    }

    console.error("Failed to finalize upload:", error);

    return NextResponse.json(
      { error: "Could not finish upload" },
      { status: 500 },
    );
  }
}
