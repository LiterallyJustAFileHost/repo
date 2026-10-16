
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { files } from "@/db/schema";
import { account, user } from "@/auth-schema";
import { getAdminSession } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim().slice(0, 100);
    const parsedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);

    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(50, Math.max(1, parsedLimit))
      : 20;
    const offset = (page - 1) * limit;

    const where = search
      ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
      : undefined;

    const [users, totals] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          fileCount: count(files.id),
          storageBytes: sql<number>`coalesce(sum(${files.size}), 0)`,
        })
        .from(user)
        .leftJoin(files, eq(files.userId, user.id))
        .where(where)
        .groupBy(
          user.id,
          user.name,
          user.email,
          user.emailVerified,
          user.createdAt,
        )
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(user)
        .where(where),
    ]);

    const userIds = users.map((item) => item.id);

    const linkedAccounts = userIds.length
      ? await db
          .select({
            userId: account.userId,
            providerId: account.providerId,
          })
          .from(account)
          .where(
            sql`${account.userId} IN (${sql.join(
              userIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
      : [];

    const providersByUser = new Map<string, Set<string>>();

    for (const linkedAccount of linkedAccounts) {
      const providers = providersByUser.get(linkedAccount.userId) ?? new Set();
      providers.add(linkedAccount.providerId);
      providersByUser.set(linkedAccount.userId, providers);
    }

    return NextResponse.json({
      users: users.map((item) => ({
        ...item,
        storageBytes: Number(item.storageBytes),
        providers: [...(providersByUser.get(item.id) ?? [])],
      })),
      pagination: {
        page,
        limit,
        total: totals[0]?.total ?? 0,
        totalPages: Math.ceil((totals[0]?.total ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin user directory failed:", error);

    return NextResponse.json(
      { error: "Unable to load users." },
      { status: 500 },
    );
  }
}
