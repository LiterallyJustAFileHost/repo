import { and, desc, ilike, or, eq, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { adminAuditLog } from "@/db/schema";
import { user } from "@/auth-schema";
import { getAdminSession } from "@/lib/admin";

const actorUser = alias(user, "audit_actor");
const targetUser = alias(user, "audit_target");

export async function GET(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const search = (params.get("search") ?? "").trim().slice(0, 200);
  const requestedPage = Number(params.get("page") ?? "1");
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const limit = 25;
  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    return NextResponse.json({ error: "Invalid page." }, { status: 400 });
  }

  const searchFilter = search
    ? or(
        ilike(adminAuditLog.action, `%${search}%`),
        ilike(adminAuditLog.actorUserId, `%${search}%`),
        ilike(adminAuditLog.targetUserId, `%${search}%`),
        ilike(adminAuditLog.previousValue, `%${search}%`),
        ilike(adminAuditLog.newValue, `%${search}%`),
      )
    : undefined;

  const where = searchFilter ? and(searchFilter) : undefined;

  try {
    const [entries, [total]] = await Promise.all([
      db
        .select({
          id: adminAuditLog.id,
          action: adminAuditLog.action,
          actorUserId: adminAuditLog.actorUserId,
          actorName: actorUser.name,
          actorEmail: actorUser.email,
          targetUserId: adminAuditLog.targetUserId,
          targetName: targetUser.name,
          targetEmail: targetUser.email,
          previousValue: adminAuditLog.previousValue,
          newValue: adminAuditLog.newValue,
          createdAt: adminAuditLog.createdAt,
        })
        .from(adminAuditLog)
        .leftJoin(actorUser, eq(adminAuditLog.actorUserId, actorUser.id))
        .leftJoin(targetUser, eq(adminAuditLog.targetUserId, targetUser.id))
        .where(where)
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(adminAuditLog)
        .where(where),
    ]);

    return NextResponse.json({
      entries,
      total: total.total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total.total / limit),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load the audit log." },
      { status: 500 },
    );
  }
}
