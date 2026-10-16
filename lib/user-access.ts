import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/auth-schema";

export async function getActiveUserAccess() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const [account] = await db
    .select({ suspended: user.suspended })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!account || account.suspended) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Account suspended or unavailable" },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}

export async function requireActiveUser() {
  const access = await getActiveUserAccess();

  if (!access.session) {
    redirect(
      access.response?.status === 403
        ? "/auth?error=account_unavailable"
        : "/auth",
    );
  }

  return access.session;
}