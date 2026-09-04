"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DownloadCloudIcon,
  FolderIcon,
  MoreVerticalIcon,
  SearchIcon,
  Triangle,
  UploadIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type DriveFile = {
  id: string;
  name: string;
  storageKey: string;
  mimeType: string;
  size: number;
  shareId: string;
  createdAt: string;
};

async function loadBuildVersion(
  setBuild: (v: string) => void,
) {
  try {
    const res = await fetch("/build.txt");

    if (!res.ok) {
      throw new Error(
        "build.txt not found",
      );
    }

    const text = await res.text();

    const cleaned = text
      .replace(/[^\x20-\x7E]/g, "")
      .trim();

    const latest =
      cleaned.slice(0, 7) || "DEV";

    const cached =
      localStorage.getItem("build");

    if (latest !== cached) {
      setBuild(latest);

      try {
        localStorage.setItem(
          "build",
          latest,
        );
      } catch (storageErr) {
        console.warn(
          "couldn't persist build cache",
          storageErr,
        );
      }
    }
  } catch {
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024),
  );

  const size =
    bytes / Math.pow(1024, index);

  return `${size.toFixed(
    index === 0 ? 0 : 1,
  )}${units[index]}`;
}

function getFileType(
  mimeType: string,
) {
  if (
    mimeType === "application/pdf"
  ) {
    return "PDF";
  }

  if (
    mimeType.startsWith("image/")
  ) {
    return mimeType
      .split("/")[1]
      .toUpperCase();
  }

  if (
    mimeType.startsWith("video/")
  ) {
    return mimeType
      .split("/")[1]
      .toUpperCase();
  }

  if (
    mimeType.startsWith("audio/")
  ) {
    return mimeType
      .split("/")[1]
      .toUpperCase();
  }

  if (
    mimeType ===
      "application/zip" ||
    mimeType ===
      "application/x-zip-compressed"
  ) {
    return "ZIP";
  }

  return "FILE";
}

function formatDate(
  dateString: string,
) {
  const date =
    new Date(dateString);

  return date.toLocaleString(
    undefined,
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export default function Home() {
  const cachedBuild =
    typeof window !== "undefined"
      ? localStorage.getItem("build")
      : null;

  const [build, setBuild] =
    useState(
      cachedBuild || "???????",
    );

  const router = useRouter();

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadError,
    setUploadError,
  ] = useState<string | null>(
    null,
  );

  const [
    files,
    setFiles,
  ] = useState<DriveFile[]>([]);

  const [
    loadingFiles,
    setLoadingFiles,
  ] = useState(true);

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null,
  );

  const [
    deletingFileId,
    setDeletingFileId,
  ] = useState<string | null>(
    null,
  );

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  function handleDownload(
    fileId: string,
  ) {
    window.location.href =
      `/api/files/${fileId}/download`;
  }

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  }

  async function loadFiles() {
    try {
      setLoadingFiles(true);

      const response =
        await fetch("/api/files");

      if (!response.ok) {
        throw new Error(
          "Failed to load files",
        );
      }

      const data =
        await response.json();

      setFiles(data.files);
    } catch (error) {
      console.error(
        "Failed to load files:",
        error,
      );
    } finally {
      setLoadingFiles(false);
    }
  }

  async function handleRename(
    file: DriveFile,
  ) {
    const name = window.prompt(
      "Enter a new file name:",
      file.name,
    );

    if (!name) {
      return;
    }

    const trimmedName =
      name.trim();

    if (
      !trimmedName ||
      trimmedName === file.name
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/files/${file.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name: trimmedName,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to rename file",
        );
      }

      setFiles(
        (currentFiles) =>
          currentFiles.map(
            (currentFile) =>
              currentFile.id ===
              file.id
                ? data.file
                : currentFile,
          ),
      );

      setOpenMenuId(null);
    } catch (error) {
      console.error(
        "Failed to rename file:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to rename file",
      );
    }
  }

  async function handleDelete(
    file: DriveFile,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${file.name}"? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingFileId(file.id);

    try {
      const response =
        await fetch(
          `/api/files/${file.id}`,
          {
            method: "DELETE",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete file",
        );
      }

      setFiles(
        (currentFiles) =>
          currentFiles.filter(
            (currentFile) =>
              currentFile.id !==
              file.id,
          ),
      );

      setOpenMenuId(null);
    } catch (error) {
      console.error(
        "Failed to delete file:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete file",
      );
    } finally {
      setDeletingFileId(null);
    }
  }

  useEffect(() => {
    loadBuildVersion(setBuild);
    loadFiles();
  }, []);

  async function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          "/api/files/upload",
          {
            method: "POST",
            body: formData,
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Upload failed",
        );
      }

      console.log(
        "Uploaded:",
        data.file,
      );

      setFiles(
        (currentFiles) => [
          data.file,
          ...currentFiles,
        ],
      );

      event.target.value = "";
    } catch (error) {
      console.error(
        "Upload failed:",
        error,
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Upload failed",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <header className="bg-surface px-8 py-4 flex flex-row gap-12 items-center border-b border-(--surface-2)">
        <div>
          <img />

          <p className="text-2xl font-black">
            Your Drive
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 border rounded-lg border-(--surface-2) px-3 py-0.75 grow max-w-[50dvw] mx-auto">
          <SearchIcon size={16} />

          <input
            placeholder="Search in your Drive"
            className="placeholder-(--surface-2)"
          />
        </div>

        <button
          onClick={handleLogout}
          className="cursor-pointer bg-(--surface-2) px-4 py-2 rounded-lg hover:bg-(--surface-3) transition-default"
        >
          Log out
        </button>
      </header>

      <main className="flex flex-col gap-4 px-8 py-8">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={
            handleFileUpload
          }
        />

        <div className="flex flex-row gap-3">
          <button
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
            className="flex flex-row gap-2 items-center colourless-main-button rounded-lg! px-6! py-2.5! text-sm disabled:opacity-50"
          >
            <UploadIcon size={20} />

            {uploading
              ? "Uploading..."
              : "Upload"}
          </button>

          <button className="flex flex-row gap-2 items-center bg-(--surface-2) rounded-lg! px-6! py-2.5! text-sm hover:bg-(--surface-3) transition-default">
            <FolderIcon size={20} />
            New Folder
          </button>

          <div className="flex flex-col gap-1 ml-auto">
            <p className="text-right">
              972MB out of 25GB used
            </p>

            <div className="w-[20dvw] h-[25%] bg-(--surface-2) rounded-full overflow-hidden">
              <div className="w-[3.888%] bg-(--surface-3) h-full" />
            </div>
          </div>
        </div>

        {uploadError && (
          <p className="text-red-500">
            {uploadError}
          </p>
        )}

        <table className="w-full text-left [&_td]:px-2 [&_td]:py-1.5 [&_td]:border-b-2 [&_td]:border-(--surface-2) [&_td]:text-lg">
          <thead>
            <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:text-(--surface-3) [&>th]:border-b-2 [&>th]:border-(--surface-1)">
              <th>
                <p className="flex flex-row gap-1.5 items-center">
                  Type

                  <Triangle
                    size={12}
                    fill="currentColor"
                    className="cursor-pointer rotate-180"
                  />
                </p>
              </th>

              <th>
                <p className="flex flex-row gap-1.5 items-center">
                  Name

                  <Triangle
                    size={12}
                    fill="currentColor"
                    className="cursor-pointer rotate-180"
                  />
                </p>
              </th>

              <th>
                <p className="flex flex-row gap-1.5 items-center">
                  Uploaded

                  <Triangle
                    size={12}
                    fill="currentColor"
                    className="cursor-pointer rotate-180"
                  />
                </p>
              </th>

              <th>
                <p className="flex flex-row gap-1.5 items-center">
                  Size

                  <Triangle
                    size={12}
                    fill="currentColor"
                    className="cursor-pointer rotate-180"
                  />
                </p>
              </th>

              <th>
                <p>Actions</p>
              </th>
            </tr>
          </thead>

          <tbody>
            {loadingFiles ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-2 py-6 text-center"
                >
                  Loading files...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-2 py-10 text-center text-(--surface-3)"
                >
                  No files yet.
                  Upload something 👀
                </td>
              </tr>
            ) : (
              files.map(
                (file) => (
                  <tr
                    key={file.id}
                  >
                    <td
                      title={
                        file.mimeType
                      }
                    >
                      {getFileType(
                        file.mimeType,
                      )}
                    </td>

                    <td
                      title={file.name}
                    >
                      {file.name}
                    </td>

                    <td
                      title={new Date(
                        file.createdAt,
                      ).toString()}
                    >
                      {formatDate(
                        file.createdAt,
                      )}
                    </td>

                    <td
                      title={`${file.size} bytes`}
                    >
                      {formatFileSize(
                        file.size,
                      )}
                    </td>

                    <td>
                      <div className="relative flex flex-row items-center gap-2">
                        <DownloadCloudIcon
                          size={20}
                          className="cursor-pointer"
                          onClick={() =>
                            handleDownload(
                              file.id,
                            )
                          }
                        />

                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId ===
                                file.id
                                ? null
                                : file.id,
                            )
                          }
                          className="cursor-pointer"
                          aria-label="File options"
                        >
                          <MoreVerticalIcon
                            size={20}
                          />
                        </button>

                        {openMenuId ===
                          file.id && (
                          <div className="absolute right-0 top-7 z-50 min-w-40 rounded-lg border border-(--surface-2) bg-surface py-1 shadow-lg">
                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-(--surface-2)"
                              onClick={() => {
                                console.log(
                                  "Copy CDN link:",
                                  file.shareId,
                                );

                                setOpenMenuId(
                                  null,
                                );
                              }}
                            >
                              Copy CDN link
                            </button>

                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-(--surface-2)"
                              onClick={() =>
                                handleRename(
                                  file,
                                )
                              }
                            >
                              Rename
                            </button>

                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-(--surface-2)"
                              onClick={() => {
                                console.log(
                                  "Cut:",
                                  file.id,
                                );

                                setOpenMenuId(
                                  null,
                                );
                              }}
                            >
                              Cut
                            </button>

                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-(--surface-2)"
                              onClick={() => {
                                console.log(
                                  "Copy:",
                                  file.id,
                                );

                                setOpenMenuId(
                                  null,
                                );
                              }}
                            >
                              Copy
                            </button>

                            <button
                              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                              onClick={() =>
                                handleDelete(
                                  file,
                                )
                              }
                              disabled={
                                deletingFileId ===
                                file.id
                              }
                            >
                              {deletingFileId ===
                              file.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}