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

export async function createResumableUploadSession({
  name,
  mimeType,
  size,
  parentId,
  userId,
  appFileId,
}: {
  name: string;
  mimeType: string;
  size: number;
  parentId: string;
  userId: string;
  appFileId: string;
}): Promise<string> {
  const { token } = await oauth2Client.getAccessToken();

  if (!token) {
    throw new Error("Could not authenticate with Google Drive");
  }

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,parents,appProperties",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify({
        name,
        mimeType,
        parents: [parentId],
        appProperties: {
          ljafhUserId: userId,
          ljafhFileId: appFileId,
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to start Google Drive upload: ${response.status} ${details}`,
    );
  }

  const sessionUrl = response.headers.get("Location");

  if (!sessionUrl) {
    throw new Error("Google Drive did not return an upload session URL");
  }

  return sessionUrl;
}