import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN!,
});

export const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

export const GOOGLE_DRIVE_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID!;