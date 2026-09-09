import http from "node:http";
import { exec } from "node:child_process";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  process.exit(1);
}

const PORT = 3456;
const REDIRECT_URI = `http://localhost:${PORT}`;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/drive",
  ],
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get("code");

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing authorization code.");
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);

    console.log("\n========================================");
    console.log("SUCCESS");
    console.log("========================================\n");

    console.log("Refresh token:");
    console.log(tokens.refresh_token ?? "(none returned)");

    console.log("\nAccess token:");
    console.log(tokens.access_token ?? "(none)");

    console.log("\n========================================");
    console.log("Copy ONLY the refresh token into:");
    console.log("GOOGLE_DRIVE_REFRESH_TOKEN");
    console.log("========================================\n");

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <h1>Authorization successful!</h1>
      <p>You can close this tab and return to your terminal.</p>
    `);

    setTimeout(() => server.close(), 1000);
  } catch (error) {
    console.error("\nOAuth error:");
    console.error(error);

    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Authorization failed. Check your terminal.");
  }
});

server.listen(PORT, async () => {
  console.log("\nOpen this URL in your browser:\n");
  console.log(authUrl);
  console.log("\nWaiting for Google authorization...\n");

  const command =
    process.platform === "darwin"
      ? `open "${authUrl}"`
      : process.platform === "win32"
        ? `start "" "${authUrl}"`
        : `xdg-open "${authUrl}"`;

  exec(command);
});