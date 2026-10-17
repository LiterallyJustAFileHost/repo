import { and, eq, gt, ne, sql, lt } from "drizzle-orm";
import { db } from "@/db";
import { account, user } from "@/auth-schema";
import { customQuotas, files, uploadReservations } from "@/db/schema";

export const STANDARD_QUOTA_BYTES = 25 * 1024 ** 3;
export const HACK_CLUB_QUOTA_BYTES = 50 * 1024 ** 3;

export function getDefaultQuota(isHackClub: boolean) {
  return isHackClub ? HACK_CLUB_QUOTA_BYTES : STANDARD_QUOTA_BYTES;
}

export class QuotaExceededError extends Error {
  constructor(
    public readonly quotaBytes: number,
    public readonly usedBytes: number,
    public readonly requestedBytes: number,
  ) {
    super("Storage quota exceeded");
    this.name = "QuotaExceededError";
  }
}

export async function reserveUploadQuota(
  userId: string,
  uploadId: string,
  requestedBytes: number,
) {
  if (!Number.isSafeInteger(requestedBytes) || requestedBytes <= 0) {
    throw new Error("Invalid upload size");
  }

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`,
    );

    const [existingReservation] = await tx
      .select()
      .from(uploadReservations)
      .where(eq(uploadReservations.id, uploadId))
      .limit(1);

    if (existingReservation && existingReservation.userId !== userId) {
      throw new Error("Upload reservation ownership mismatch");
    }

    const now = new Date();

    await tx
      .delete(uploadReservations)
      .where(lt(uploadReservations.expiresAt, now));

    const [userRecord] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      throw new Error("User not found");
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
          gt(uploadReservations.expiresAt, now),
          ne(uploadReservations.id, uploadId),
        ),
      );

    const quotaBytes = Number(
      customQuota?.quotaBytes ?? getDefaultQuota(Boolean(hackClubAccount)),
    );
    const usedBytes = Number(usage?.usedBytes ?? 0);
    const reservedBytes = Number(reserved?.reservedBytes ?? 0);

    if (usedBytes + reservedBytes + requestedBytes > quotaBytes) {
      throw new QuotaExceededError(
        quotaBytes,
        usedBytes + reservedBytes,
        requestedBytes,
      );
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await tx
      .insert(uploadReservations)
      .values({
        id: uploadId,
        userId,
        sizeBytes: requestedBytes,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: uploadReservations.id,
        set: { sizeBytes: requestedBytes, expiresAt },
      });

    return {
      quotaBytes,
      usedBytes,
      reservedBytes,
      remainingBytes: Math.max(
        0,
        quotaBytes - usedBytes - reservedBytes - requestedBytes,
      ),
    };
  });
}

export async function releaseUploadReservation(
  userId: string,
  uploadId: string,
) {
  await db
    .delete(uploadReservations)
    .where(
      and(
        eq(uploadReservations.id, uploadId),
        eq(uploadReservations.userId, userId),
      ),
    );
}

export async function cleanupExpiredUploadReservations() {
  const result = await db
    .delete(uploadReservations)
    .where(lt(uploadReservations.expiresAt, new Date()))
    .returning({ id: uploadReservations.id });

  return result.length;
}
