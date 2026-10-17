import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq, gt, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { account, user } from "@/auth-schema";
import { customQuotas, files, folders, uploadReservations } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import {
  createResumableUploadSession,
  drive,
  GOOGLE_DRIVE_FOLDER_ID,
} from "@/lib/google-drive";
import {
  getDefaultQuota,
  QuotaExceededError,
  releaseUploadReservation,
  reserveUploadQuota,
} from "@/lib/quota";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  let uploadedDriveFileId: string | undefined;
  let userId: string | undefined;
  let fileId: string | undefined;
  let reservationCreated = false;
  let fileSaved = false;

  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    userId = access.session.user.id;

    const encodedName = request.headers.get("x-file-name");
    const sizeHeader = request.headers.get("x-file-size");
    const folderIdHeader = request.headers.get("x-folder-id");

    let name: string;

    try {
      name = decodeURIComponent(encodedName ?? "");
    } catch {
      return NextResponse.json(
        { error: "Invalid file name encoding" },
        { status: 400 },
      );
    }

    const size = Number(sizeHeader);
    const mimeType =
      request.headers.get("content-type") ||
      "application/octet-stream";
    const folderId = folderIdHeader?.trim() || null;

    if (
      !name.trim() ||
      name.length > 255 ||
      /[\u0000-\u001f\u007f]/.test(name)
    ) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 },
      );
    }

    if (!Number.isSafeInteger(size) || size <= 0 || !request.body) {
      return NextResponse.json(
        { error: "Invalid file size or missing file body" },
        { status: 400 },
      );
    }

    let parentId = GOOGLE_DRIVE_FOLDER_ID;

    if (folderId) {
      const [folder] = await db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, folderId),
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

      parentId = folder.storageKey;
    }

    fileId = randomUUID();
    const shareId = randomUUID();

    await reserveUploadQuota(userId, fileId, size);
    reservationCreated = true;

    const uploadUrl = await createResumableUploadSession({
      name,
      mimeType,
      size,
      parentId,
      userId,
      appFileId: fileId,
    });

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(size),
      },
      body: request.body,
      duplex: "half",
      cache: "no-store",
    } as RequestInit);

    if (!uploadResponse.ok) {
      const details = await uploadResponse.text();

      console.error(
        "Google Drive upload failed:",
        uploadResponse.status,
        details,
      );

      return NextResponse.json(
        {
          error: `Google Drive upload failed (${uploadResponse.status})`,
        },
        { status: 502 },
      );
    }

    const uploaded = await uploadResponse.json();
    uploadedDriveFileId = uploaded.id;

    if (!uploadedDriveFileId) {
      throw new Error("Google Drive did not return a file ID");
    }

    const verifiedResponse = await drive.files.get({
      fileId: uploadedDriveFileId,
      fields: "id,name,mimeType,size,appProperties",
    });

    const verified = verifiedResponse.data;

    if (
      verified.appProperties?.ljafhUserId !== userId ||
      verified.appProperties?.ljafhFileId !== fileId ||
      !verified.id ||
      !verified.name ||
      !verified.mimeType ||
      verified.size == null ||
      Number(verified.size) !== size
    ) {
      throw new Error("Uploaded file verification failed");
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
            eq(uploadReservations.id, fileId!),
            eq(uploadReservations.userId, userId!),
            gt(uploadReservations.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!reservation || reservation.sizeBytes !== size) {
        throw new Error("Upload reservation missing or invalid");
      }

      const [customQuota] = await tx
        .select({ quotaBytes: customQuotas.quotaBytes })
        .from(customQuotas)
        .where(eq(customQuotas.userId, userId!))
        .limit(1);

      const [hackClubAccount] = await tx
        .select({ userId: account.userId })
        .from(account)
        .where(
          and(
            eq(account.userId, userId!),
            eq(account.providerId, "hackclub"),
          ),
        )
        .limit(1);

      const [userRecord] = await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId!))
        .limit(1);

      if (!userRecord) {
        throw new Error("User not found");
      }

      const [usage] = await tx
        .select({
          usedBytes: sql<number>`coalesce(sum(${files.size}), 0)::bigint`,
        })
        .from(files)
        .where(eq(files.userId, userId!));

      const [reserved] = await tx
        .select({
          reservedBytes: sql<number>`coalesce(sum(${uploadReservations.sizeBytes}), 0)::bigint`,
        })
        .from(uploadReservations)
        .where(
          and(
            eq(uploadReservations.userId, userId!),
            gt(uploadReservations.expiresAt, new Date()),
            ne(uploadReservations.id, fileId!),
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
          id: fileId!,
          userId: userId!,
          folderId,
          name: verified.name!,
          storageKey: verified.id!,
          mimeType: verified.mimeType!,
          size,
          shareId,
        })
        .returning();

      await tx
        .delete(uploadReservations)
        .where(
          and(
            eq(uploadReservations.id, fileId!),
            eq(uploadReservations.userId, userId!),
          ),
        );

      return saved;
    });

    fileSaved = true;
    reservationCreated = false;

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

    console.error("Failed to upload file:", error);

    if (uploadedDriveFileId && !fileSaved) {
      try {
        await drive.files.delete({ fileId: uploadedDriveFileId });
      } catch (cleanupError) {
        console.error("Failed to clean up Drive file:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  } finally {
    if (reservationCreated && userId && fileId) {
      try {
        await releaseUploadReservation(userId, fileId);
      } catch (releaseError) {
        console.error("Failed to release upload reservation:", releaseError);
      }
    }
  }
}
