import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, count, desc, eq, ilike, inArray, or, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { account, user } from "@/auth-schema";
import { adminAuditLog, customQuotas, files } from "@/db/schema";
import { getAdminSession } from "@/lib/admin";
import { getDefaultQuota } from "@/lib/quota";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      suspended: user.suspended,
      customQuotaBytes: customQuotas.quotaBytes,
      quotaReason: customQuotas.reason,
      quotaUpdatedAt: customQuotas.updatedAt,
    })
    .from(user)
    .leftJoin(customQuotas, eq(customQuotas.userId, user.id))
    .where(
      search
        ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
        : undefined,
    )
    .orderBy(desc(user.createdAt))
    .limit(100);

  const userIds = users.map((item) => item.id);

  const [usage, providers] = userIds.length
    ? await Promise.all([
        db
          .select({
            userId: files.userId,
            bytes: sum(files.size),
            fileCount: count(),
          })
          .from(files)
          .where(inArray(files.userId, userIds))
          .groupBy(files.userId),
        db
          .select({ userId: account.userId })
          .from(account)
          .where(
            and(
                eq(account.providerId, "hackclub"),
                inArray(account.userId, userIds),
            ),
        )
      ])
    : [[], []];

  const usageByUser = new Map(
    usage.map((item) => [
      item.userId,
      { bytes: Number(item.bytes ?? 0), fileCount: item.fileCount },
    ]),
  );

  const hackClubUsers = new Set(providers.map((item) => item.userId));

  const rows = users.map((item) => {
    const used = usageByUser.get(item.id) ?? { bytes: 0, fileCount: 0 };
    const isHackClub = hackClubUsers.has(item.id);
    const defaultQuotaBytes = getDefaultQuota(isHackClub);

    return {
      ...item,
      isHackClub,
      usedBytes: used.bytes,
      fileCount: used.fileCount,
      defaultQuotaBytes,
      effectiveQuotaBytes: item.customQuotaBytes ?? defaultQuotaBytes,
    };
  });

  const [totals] = await db
    .select({
      users: count(),
      storageBytes: sum(files.size),
      files: count(files.id),
    })
    .from(user)
    .leftJoin(files, eq(files.userId, user.id));

  return NextResponse.json({
    users: rows,
    summary: {
      users: totals.users,
      storageBytes: Number(totals.storageBytes ?? 0),
      files: totals.files,
      customQuotas: rows.filter((item) => item.customQuotaBytes !== null).length,
    },
  });
}

export async function PATCH(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return errorResponse("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const reset = body?.reset === true;
  const quotaBytes = body?.quotaBytes;

  if (!userId) return errorResponse("User ID is required.", 400);
  if (!reset && (!Number.isSafeInteger(quotaBytes) || quotaBytes < 0)) {
    return errorResponse("Enter a valid quota in bytes.", 400);
  }
  if (!reset && !reason) {
    return errorResponse("A reason is required for custom quotas.", 400);
  }
  if (reason.length > 1000) {
    return errorResponse("The reason must be 1000 characters or fewer.", 400);
  }

  const [target] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) return errorResponse("User not found.", 404);

  const [previous] = await db
    .select()
    .from(customQuotas)
    .where(eq(customQuotas.userId, userId))
    .limit(1);

  await db.transaction(async (tx) => {
    if (reset) {
      await tx.delete(customQuotas).where(eq(customQuotas.userId, userId));
    } else {
      await tx
        .insert(customQuotas)
        .values({
          userId,
          quotaBytes,
          updatedBy: admin.user.id,
          reason,
        })
        .onConflictDoUpdate({
          target: customQuotas.userId,
          set: {
            quotaBytes,
            updatedBy: admin.user.id,
            reason,
            updatedAt: new Date(),
          },
        });
    }

    await tx.insert(adminAuditLog).values({
      id: randomUUID(),
      actorUserId: admin.user.id,
      action: reset ? "quota.reset" : "quota.update",
      targetUserId: userId,
      previousValue: previous ? JSON.stringify(previous) : null,
      newValue: reset ? null : JSON.stringify({ quotaBytes, reason }),
    });
  });

  return NextResponse.json({ success: true });
}