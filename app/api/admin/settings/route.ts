import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const configuration = [
    {
      name: "Database",
      configured: Boolean(process.env.DATABASE_URL),
      detail: "PostgreSQL connection configuration",
    },
    {
      name: "Google Drive",
      configured: Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
        process.env.GOOGLE_DRIVE_FOLDER_ID
      ),
      detail: "File storage integration",
    },
    {
      name: "Authentication",
      configured: Boolean(
        process.env.BETTER_AUTH_SECRET &&
        process.env.BETTER_AUTH_URL
      ),
      detail: "Better Auth configuration",
    },
    {
      name: "Google OAuth",
      configured: Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET
      ),
      detail: "Google sign-in credentials",
    },
    {
      name: "Admin access",
      configured: Boolean(process.env.ADMIN_EMAILS?.trim()),
      detail: "Environment-based administrator allowlist",
    },
  ];

  return NextResponse.json({
    application: {
      name: "Literally Just A File Host",
      environment: process.env.NODE_ENV ?? "unknown",
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      configuredAt: new Date().toISOString(),
    },
    configuration,
  });
}
