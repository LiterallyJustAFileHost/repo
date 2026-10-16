import { NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLog } from "@/db/schema";
import { user } from "@/auth-schema";
import { getAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = 25;
  const query = searchParams.get("q")?.trim() ?? "";
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filters = [
    gte(adminAuditLog.createdAt, since),
    or(
      ilike(adminAuditLog.action, "%suspend%"),
      ilike(adminAuditLog.action, "%delete%"),
      ilike(adminAuditLog.action, "%quota%"),
      ilike(adminAuditLog.action, "%abuse%"),
      ilike(adminAuditLog.action, "%upload%"),
      ilike(adminAuditLog.action, "%role%")
    ),
  ];

  const where = query
    ? and(
        ...filters,
        or(
          ilike(adminAuditLog.action, `%${query}%`),
          ilike(adminAuditLog.targetUserId, `%${query}%`),
          ilike(user.email, `%${query}%`),
          ilike(user.name, `%${query}%`)
        )
      )
    : and(...filters);

  const [entries, totalResult, actionCounts] = await Promise.all([
    db
      .select({
        id: adminAuditLog.id,
        action: adminAuditLog.action,
        targetUserId: adminAuditLog.targetUserId,
        previousValue: adminAuditLog.previousValue,
        newValue: adminAuditLog.newValue,
        createdAt: adminAuditLog.createdAt,
        actorEmail: user.email,
        actorName: user.name,
      })
      .from(adminAuditLog)
      .leftJoin(user, eq(adminAuditLog.actorUserId, user.id))
      .where(where)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminAuditLog)
      .leftJoin(user, eq(adminAuditLog.actorUserId, user.id))
      .where(where),
    db
      .select({
        action: adminAuditLog.action,
        count: sql<number>`count(*)::int`,
      })
      .from(adminAuditLog)
      .where(gte(adminAuditLog.createdAt, since))
      .groupBy(adminAuditLog.action),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return NextResponse.json({
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    periodDays: 30,
    actionCounts,
  });
}
