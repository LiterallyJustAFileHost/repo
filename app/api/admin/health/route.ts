import { NextResponse } from "next/server";

import { db } from "@/db";
import { user } from "@/auth-schema";
import { drive } from "@/lib/google-drive";
import { getAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Check = {
  status: "healthy" | "degraded" | "unavailable";
  latencyMs: number | null;
  message: string;
};

async function measure(
  operation: () => Promise<unknown>,
  successMessage: string,
): Promise<Check> {
  const start = performance.now();

  try {
    await operation();

    return {
      status: "healthy",
      latencyMs: Math.round(performance.now() - start),
      message: successMessage,
    };
  } catch {
    return {
      status: "unavailable",
      latencyMs: Math.round(performance.now() - start),
      message: "The service check failed.",
    };
  }
}

export async function GET() {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();

  const [database, googleDrive] = await Promise.all([
    measure(
      () => db.select({ id: user.id }).from(user).limit(1),
      "Database query succeeded.",
    ),
    measure(
      () => drive.about.get({ fields: "user(displayName)" }),
      "Google Drive API is reachable.",
    ),
  ]);

  const checks = { database, googleDrive };
  const statuses = Object.values(checks).map((check) => check.status);
  const overallStatus = statuses.every((status) => status === "healthy")
    ? "healthy"
    : statuses.some((status) => status === "unavailable")
      ? "degraded"
      : "healthy";

  return NextResponse.json({
    checkedAt,
    overallStatus,
    application: {
      status: "healthy",
      environment: process.env.NODE_ENV ?? "unknown",
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
    },
    checks,
  });
}
