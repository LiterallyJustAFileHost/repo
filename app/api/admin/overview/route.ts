
import { NextResponse } from "next/server";
import { count, sum, eq } from "drizzle-orm";

import { db } from "@/db";
import { files, folders, customQuotas } from "@/db/schema";
import { user, account } from "@/auth-schema";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [
      [users],
      [fileStats],
      [folderStats],
      [quotaStats],
      [hackClubStats],
    ] = await Promise.all([
      db.select({ total: count() }).from(user),

      db.select({
        total: count(),
        bytes: sum(files.size),
      }).from(files),

      db.select({ total: count() }).from(folders),

      db.select({ total: count() }).from(customQuotas),

      db.select({
        total: count(),
      })
        .from(account)
        .where(eq(account.providerId, "hackclub")),
    ]);

    return NextResponse.json({
      overview: {
        totalUsers: users.total,
        totalFiles: fileStats.total,
        totalStorageBytes: Number(fileStats.bytes ?? 0),
        totalFolders: folderStats.total,
        customQuotaAccounts: quotaStats.total,
        hackClubAccounts: hackClubStats.total,
      },
    });
  } catch (error) {
    console.error("Failed to load admin overview:", error);

    return NextResponse.json(
      { error: "Failed to load admin overview" },
      { status: 500 },
    );
  }
}
