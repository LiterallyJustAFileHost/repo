import { NextResponse } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/auth-schema";
import { customQuotas, files, uploadReservations } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import { getDefaultQuota } from "@/lib/quota";

export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const now = new Date();

    const [[usage], [reserved], [customQuota], [hackClubAccount]] =
      await Promise.all([
        db
          .select({
            usedBytes: sql<number>`coalesce(sum(${files.size}), 0)::bigint`,
            fileCount: sql<number>`count(*)::int`,
          })
          .from(files)
          .where(eq(files.userId, userId)),
        db
          .select({
            reservedBytes: sql<number>`coalesce(sum(${uploadReservations.sizeBytes}), 0)::bigint`,
          })
          .from(uploadReservations)
          .where(
            and(
              eq(uploadReservations.userId, userId),
              gt(uploadReservations.expiresAt, now),
            ),
          ),
        db
          .select({ quotaBytes: customQuotas.quotaBytes })
          .from(customQuotas)
          .where(eq(customQuotas.userId, userId))
          .limit(1),
        db
          .select({ userId: account.userId })
          .from(account)
          .where(
            and(
              eq(account.userId, userId),
              eq(account.providerId, "hackclub"),
            ),
          )
          .limit(1),
      ]);

    const usedBytes = Number(usage?.usedBytes ?? 0);
    const reservedBytes = Number(reserved?.reservedBytes ?? 0);
    const quotaBytes = Number(
      customQuota?.quotaBytes ??
        getDefaultQuota(Boolean(hackClubAccount)),
    );
    const totalUsedBytes = usedBytes + reservedBytes;

    return NextResponse.json({
      usedBytes,
      reservedBytes,
      totalUsedBytes,
      quotaBytes,
      remainingBytes: Math.max(0, quotaBytes - totalUsedBytes),
      usagePercent:
        quotaBytes > 0
          ? Math.min(100, (totalUsedBytes / quotaBytes) * 100)
          : 100,
      fileCount: Number(usage?.fileCount ?? 0),
    });
  } catch (error) {
    console.error("Failed to fetch storage quota:", error);

    return NextResponse.json(
      { error: "Failed to fetch storage usage" },
      { status: 500 },
    );
  }
}
