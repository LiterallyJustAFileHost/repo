import { randomUUID } from "crypto";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { privacyRequests } from "@/db/schema";
import { user } from "@/auth-schema";
import { adminAuditLog } from "@/db/schema";
import { getAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = 25;
  const query = params.get("q")?.trim() ?? "";
  const status = params.get("status") ?? "";

  const filters = [];

  if (["pending", "in_progress", "completed", "rejected"].includes(status)) {
    filters.push(eq(privacyRequests.status, status));
  }

  if (query) {
    filters.push(
      or(
        ilike(user.email, `%${query}%`),
        ilike(user.name, `%${query}%`),
        ilike(privacyRequests.type, `%${query}%`),
        ilike(privacyRequests.status, `%${query}%`)
      )!
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [requests, totalResult] = await Promise.all([
    db
      .select({
        id: privacyRequests.id,
        userId: privacyRequests.userId,
        name: user.name,
        email: user.email,
        type: privacyRequests.type,
        status: privacyRequests.status,
        notes: privacyRequests.notes,
        createdAt: privacyRequests.createdAt,
        updatedAt: privacyRequests.updatedAt,
      })
      .from(privacyRequests)
      .leftJoin(user, eq(privacyRequests.userId, user.id))
      .where(where)
      .orderBy(desc(privacyRequests.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(privacyRequests)
      .leftJoin(user, eq(privacyRequests.userId, user.id))
      .where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return NextResponse.json({
    requests,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function PATCH(request: Request) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

  if (!id || !["pending", "in_progress", "completed", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(privacyRequests)
    .where(eq(privacyRequests.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const [updated] = await db
    .update(privacyRequests)
    .set({
      status,
      notes: notes === null ? existing.notes : notes,
      updatedAt: new Date(),
    })
    .where(eq(privacyRequests.id, id))
    .returning();

  await db.insert(adminAuditLog).values({
    id: randomUUID(),
    actorUserId: admin.user.id,
    action: "privacy_request_updated",
    targetUserId: existing.userId,
    previousValue: JSON.stringify({
      status: existing.status,
      notes: existing.notes,
    }),
    newValue: JSON.stringify({
      status: updated.status,
      notes: updated.notes,
      requestId: id,
    }),
  });

  return NextResponse.json({ request: updated });
}
