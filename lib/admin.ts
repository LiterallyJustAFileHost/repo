import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { adminRoles } from "@/db/schema";

export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}

export async function getAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;
  if (isAdminEmail(session.user.email)) return session;

  try {
    const [role] = await db
      .select({ userId: adminRoles.userId })
      .from(adminRoles)
      .where(eq(adminRoles.userId, session.user.id))
      .limit(1);

    return role ? session : null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth");
  }

  return session;
}
