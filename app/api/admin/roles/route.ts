import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { adminAuditLog, adminRoles } from "@/db/schema";
import { user } from "@/auth-schema";
import { getAdminSession, isAdminEmail } from "@/lib/admin";

function createId() {
  return crypto.randomUUID();
}

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const [users, databaseRoles] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user),
      db
        .select({
          userId: adminRoles.userId,
          grantedBy: adminRoles.grantedBy,
          createdAt: adminRoles.createdAt,
        })
        .from(adminRoles),
    ]);

    const databaseRoleMap = new Map(
      databaseRoles.map((role) => [role.userId, role]),
    );

    const envEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    const environmentAdmins = users
      .filter((account) => envEmails.includes(account.email.toLowerCase()))
      .map((account) => ({
        ...account,
        source: "environment" as const,
        grantedBy: null,
        createdAt: null,
        protected: true,
      }));

    const databaseAdmins = users
      .filter((account) => databaseRoleMap.has(account.id))
      .map((account) => {
        const role = databaseRoleMap.get(account.id)!;

        return {
          ...account,
          source: "database" as const,
          grantedBy: role.grantedBy,
          createdAt: role.createdAt,
          protected: isAdminEmail(account.email),
        };
      });

    const merged = new Map(
      [...environmentAdmins, ...databaseAdmins].map((account) => [
        account.id,
        account,
      ]),
    );

    return NextResponse.json({
      admins: [...merged.values()].sort((a, b) =>
        a.email.localeCompare(b.email),
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load administrator roles." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || email.length > 320) {
      return NextResponse.json(
        { error: "Enter a valid account email." },
        { status: 400 },
      );
    }

    const [target] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!target) {
      return NextResponse.json(
        { error: "No account exists with that email." },
        { status: 404 },
      );
    }

    const [existing] = await db
      .select({ userId: adminRoles.userId })
      .from(adminRoles)
      .where(eq(adminRoles.userId, target.id))
      .limit(1);

    if (existing || isAdminEmail(target.email)) {
      return NextResponse.json(
        { error: "This account already has administrator access." },
        { status: 409 },
      );
    }

    await db.transaction(async (tx) => {
      await tx.insert(adminRoles).values({
        userId: target.id,
        grantedBy: session.user.id,
      });

      await tx.insert(adminAuditLog).values({
        id: createId(),
        actorUserId: session.user.id,
        action: "admin_role_granted",
        targetUserId: target.id,
        previousValue: null,
        newValue: JSON.stringify({ email: target.email }),
      });
    });

    return NextResponse.json({ success: true, admin: target });
  } catch {
    return NextResponse.json(
      { error: "Unable to grant administrator access." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId =
      typeof body.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
      return NextResponse.json(
        { error: "A user ID is required." },
        { status: 400 },
      );
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

    if (!target) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 },
      );
    }

    if (isAdminEmail(target.email)) {
      return NextResponse.json(
        { error: "Environment-configured admins cannot be removed here." },
        { status: 403 },
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove your own administrator access." },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ userId: adminRoles.userId })
      .from(adminRoles)
      .where(eq(adminRoles.userId, userId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "This account has no database-granted admin role." },
        { status: 404 },
      );
    }

    await db.transaction(async (tx) => {
      const remaining = await tx
        .select({ userId: adminRoles.userId })
        .from(adminRoles)
        .where(ne(adminRoles.userId, userId));

      const envEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

      const [envAdmin] = await tx
        .select({ id: user.id })
        .from(user)
        .where(
          and(
            eq(user.email, envEmails[0] ?? ""),
          ),
        )
        .limit(1);

      if (remaining.length === 0 && !envAdmin) {
        throw new Error("LAST_ADMIN");
      }

      await tx
        .delete(adminRoles)
        .where(eq(adminRoles.userId, userId));

      await tx.insert(adminAuditLog).values({
        id: createId(),
        actorUserId: session.user.id,
        action: "admin_role_revoked",
        targetUserId: userId,
        previousValue: JSON.stringify({ email: target.email }),
        newValue: null,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return NextResponse.json(
        { error: "The last administrator cannot be removed." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to revoke administrator access." },
      { status: 500 },
    );
  }
}
