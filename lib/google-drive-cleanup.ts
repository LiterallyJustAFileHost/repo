import { drive } from "@/lib/google-drive";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export async function deleteDriveFolderRecursive(folderId: string) {
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,mimeType)",
      pageSize: 1000,
      pageToken,
    });

    for (const child of response.data.files ?? []) {
      if (!child.id) {
        throw new Error("Google Drive returned an item without an ID.");
      }

      if (child.mimeType === FOLDER_MIME_TYPE) {
        await deleteDriveFolderRecursive(child.id);
      } else {
        await drive.files.delete({ fileId: child.id });
      }
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  await drive.files.delete({ fileId: folderId });
}
