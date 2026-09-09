import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const redirectUri =
    "https://literallyjustafilehost.com/api/google-drive-auth/callback";

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri,
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  return NextResponse.redirect(authUrl);
}