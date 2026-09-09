import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return new NextResponse("Missing authorization code.", {
      status: 400,
    });
  }

  const redirectUri =
    "https://literallyjustafilehost.com/api/google-drive-auth/callback";

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("========================================");
    console.log("GOOGLE DRIVE PRODUCTION REFRESH TOKEN");
    console.log(tokens.refresh_token ?? "(NO REFRESH TOKEN RETURNED)");
    console.log("========================================");

    return new NextResponse(
      "Authorization successful. Check the server/Vercel logs for the refresh token.",
    );
  } catch (error) {
    console.error("Google OAuth token exchange failed:", error);

    return new NextResponse(
      "Token exchange failed. Check the server logs.",
      { status: 500 },
    );
  }
}