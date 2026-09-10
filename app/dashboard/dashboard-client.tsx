"use client";

import { useEffect, useRef, useState } from "react";
import {
  DownloadCloudIcon,
  FolderIcon,
  MoreHorizontalIcon,
  SearchIcon,
  Triangle,
  UploadIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Footer } from "../components/footer";

type DriveFile = {
  id: string;
  userId: string;
  folderId: string | null;
  name: string;
  storageKey: string;
  mimeType: string;
  size: number;
  shareId: string;
  createdAt: string;
};

type DriveFolder = {
  id: string;
  name: string;
  parentId: string | null;
  storageKey?: string;
  createdAt: string;
};

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

function splitFileName(name: string) {
  const lastDot = name.lastIndexOf(".");

  if (lastDot <= 0) {
    return {
      base: name,
      ext: "",
    };
  }

  return {
    base: name.slice(0, lastDot),
    ext: name.slice(lastDot),
  };
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

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return (
    <motion.div
      className={`rounded bg-(--surface-2) ${className}`}
      animate={{
        opacity: [0.4, 0.9, 0.4],
      }}
      transition={{
        duration: 1.4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function SkeletonRow({
  delay = 0,
}: {
  delay?: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay }}
    >
      <td>
        <SkeletonBlock className="h-7 w-16" />
      </td>

      <td>
        <SkeletonBlock className="h-7 w-60" />
      </td>

      <td>
        <SkeletonBlock className="h-7 w-24" />
      </td>

      <td>
        <SkeletonBlock className="h-7 w-16" />
      </td>

      <td>
        <SkeletonBlock className="h-7 w-13" />
      </td>
    </motion.tr>
  );
}

function SortableHeader({
  label,
  sortKey: headerKey,
  activeKey,
  activeDir,
  onSort,
}: {
  label: string;
  sortKey:
    | "type"
    | "name"
    | "createdAt"
    | "size";
  activeKey: string;
  activeDir: "asc" | "desc";
  onSort: (
    key:
      | "type"
      | "name"
      | "createdAt"
      | "size",
  ) => void;
}) {
  const isActive =
    headerKey === activeKey;

  return (
    <th>
      <button
        onClick={() =>
          onSort(headerKey)
        }
        className="flex flex-row gap-1.5 items-center p-0!"
      >
        {label}

        <Triangle
          size={12}
          fill="currentColor"
          className={`transition-transform ${
            isActive &&
            activeDir === "asc"
              ? "rotate-0"
              : "rotate-180"
          } ${
            isActive
              ? ""
              : "opacity-40"
          }`}
        />
      </button>
    </th>
  );
}

export default function Home() {
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<DriveFolder[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<| "type" | "name" | "createdAt" | "size">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [creatingFolderInput, setCreatingFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  function handleDownload(fileId: string) {
    window.location.href = `/api/files/${fileId}/download`;
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

  function startCreateFolder() {
    setCreatingFolderInput(true);
    setNewFolderName("");

    requestAnimationFrame(() => {
      newFolderInputRef.current?.focus();
    });
  }

  function cancelCreateFolder() {
    if (creatingFolder) {
      return;
    }

    setCreatingFolderInput(false);
    setNewFolderName("");
  }

  async function handleCreateFolder() {
    const trimmedName =
      newFolderName.trim();

    if (!trimmedName) {
      cancelCreateFolder();
      return;
    }

    try {
      setCreatingFolder(true);

      const response =
        await fetch("/api/folders", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            parentId: currentFolderId,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create folder",
        );
      }

      setFolders(
        (currentFolders) => [
          data.folder,
          ...currentFolders,
        ],
      );

      setCreatingFolderInput(false);
      setNewFolderName("");
    } catch (error) {
      console.error(
        "Failed to create folder:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create folder",
      );
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleOpenFolder(
    folder: DriveFolder,
  ) {
    try {
      setLoadingFiles(true);

      const response =
        await fetch(
          `/api/folders/${folder.id}`,
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to open folder",
        );
      }

      if (
        currentFolderId !== folder.id
      ) {
        setFolderHistory(
          (currentHistory) => [
            ...currentHistory,
            folder,
          ],
        );
      }

      setCurrentFolderId(
        folder.id,
      );

      setCurrentFolderName(
        folder.name,
      );

      setFiles(
        data.files ?? [],
      );

      setFolders(
        data.folders ?? [],
      );

      setOpenMenuId(null);
      setSearchQuery("");
      setCreatingFolderInput(false);
      setNewFolderName("");
    } catch (error) {
      console.error(
        "Failed to open folder:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to open folder",
      );
    } finally {
      setLoadingFiles(false);
    }
  }

  async function handleGoBack() {
    if (!currentFolderId) {
      return;
    }

    const previousHistory =
      folderHistory.slice(
        0,
        -1,
      );

    const previousFolder =
      previousHistory[
        previousHistory.length - 1
      ];

    try {
      setLoadingFiles(true);

      if (!previousFolder) {
        await handleGoToRoot();
        return;
      }

      const response =
        await fetch(
          `/api/folders/${previousFolder.id}`,
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to go back",
        );
      }

      setCurrentFolderId(
        previousFolder.id,
      );

      setCurrentFolderName(
        previousFolder.name,
      );

      setFolderHistory(
        previousHistory,
      );

      setFiles(
        data.files ?? [],
      );

      setFolders(
        data.folders ?? [],
      );

      setSearchQuery("");
      setOpenMenuId(null);
      setCreatingFolderInput(false);
      setNewFolderName("");
    } catch (error) {
      console.error(
        "Failed to go back:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to go back",
      );
    } finally {
      setLoadingFiles(false);
    }
  }

  async function handleGoToRoot() {
    try {
      setLoadingFiles(true);

      const response =
        await fetch("/api/files");

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load files",
        );
      }

      setCurrentFolderId(null);
      setCurrentFolderName(null);
      setFolderHistory([]);

      setFiles(
        data.files ?? [],
      );

      setFolders(
        data.folders ?? [],
      );

      setSearchQuery("");
      setOpenMenuId(null);
      setCreatingFolderInput(false);
      setNewFolderName("");
    } catch (error) {
      console.error(
        "Failed to return to root:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to return to root",
      );
    } finally {
      setLoadingFiles(false);
    }
  }

  async function handleRenameFolder(
    folder: DriveFolder,
  ) {
    setOpenMenuId(null);

    const newName =
      window.prompt(
        "Rename folder",
        folder.name,
      );

    if (newName === null) {
      return;
    }

    const trimmedName =
      newName.trim();

    if (!trimmedName) {
      return;
    }

    if (
      trimmedName.length >= 256
    ) {
      alert(
        "Folder name is too long.",
      );
      return;
    }

    try {
      const response =
        await fetch(
          `/api/folders/${folder.id}`,
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
            "Failed to rename folder",
        );
      }

      setFolders(
        (currentFolders) =>
          currentFolders.map(
            (currentFolder) =>
              currentFolder.id ===
              folder.id
                ? data.folder
                : currentFolder,
          ),
      );

      if (
        currentFolderId === folder.id
      ) {
        setCurrentFolderName(
          trimmedName,
        );
      }

      setFolderHistory(
        (currentHistory) =>
          currentHistory.map(
            (historyFolder) =>
              historyFolder.id ===
              folder.id
                ? {
                    ...historyFolder,
                    name: trimmedName,
                  }
                : historyFolder,
          ),
      );
    } catch (error) {
      console.error(
        "Failed to rename folder:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to rename folder",
      );
    }
  }

  async function handleDeleteFolder(
    folder: DriveFolder,
  ) {
    setOpenMenuId(null);

    const confirmed =
      window.confirm(
        `Delete "${folder.name}" and everything inside it?\n\nThis cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingFolderId(
      folder.id,
    );

    try {
      const response =
        await fetch(
          `/api/folders/${folder.id}`,
          {
            method: "DELETE",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete folder",
        );
      }

      if (
        currentFolderId === folder.id
      ) {
        await handleGoToRoot();
        return;
      }

      setFolders(
        (currentFolders) =>
          currentFolders.filter(
            (currentFolder) =>
              currentFolder.id !==
              folder.id,
          ),
      );

      setFolderHistory(
        (currentHistory) =>
          currentHistory.filter(
            (historyFolder) =>
              historyFolder.id !==
              folder.id,
          ),
      );
    } catch (error) {
      console.error(
        "Failed to delete folder:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete folder",
      );
    } finally {
      setDeletingFolderId(null);
    }
  }

  function startRename(
    file: DriveFile,
  ) {
    setEditingFileId(file.id);
    setRenameValue(file.name);
    setOpenMenuId(null);

    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }

  function cancelRename() {
    if (renaming) {
      return;
    }

    setEditingFileId(null);
    setRenameValue("");
  }

  async function handleRename(
    file: DriveFile,
  ) {
    const trimmedName =
      renameValue.trim();

    if (
      !trimmedName ||
      trimmedName === file.name
    ) {
      cancelRename();
      return;
    }

    try {
      setRenaming(true);

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

      setEditingFileId(null);
      setRenameValue("");
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
    } finally {
      setRenaming(false);
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
    let cancelled = false;

    async function load() {
      try {
        const response =
          await fetch("/api/files");

        if (!response.ok) {
          throw new Error(
            "Failed to load files",
          );
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        setFiles(
          data.files ?? [],
        );

        setFolders(
          data.folders ?? [],
        );

        setCurrentFolderId(null);
        setCurrentFolderName(null);
        setFolderHistory([]);
      } catch (error) {
        console.error(
          "Failed to load files:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoadingFiles(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
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

      if (currentFolderId) {
        formData.append(
          "folderId",
          currentFolderId,
        );
      }

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

  function handleSort(
    key: typeof sortKey,
  ) {
    if (key === sortKey) {
      setSortDir(
        (currentDir) =>
          currentDir === "asc"
            ? "desc"
            : "asc",
      );

      return;
    }

    setSortKey(key);
    setSortDir("asc");
  }

  function compareFolders(
    a: DriveFolder,
    b: DriveFolder,
  ) {
    const dir =
      sortDir === "asc"
        ? 1
        : -1;

    if (
      sortKey === "name"
    ) {
      return (
        a.name.localeCompare(
          b.name,
        ) * dir
      );
    }

    if (
      sortKey === "createdAt"
    ) {
      return (
        (new Date(
          a.createdAt,
        ).getTime() -
          new Date(
            b.createdAt,
          ).getTime()) * dir
      );
    }

    return 0;
  }

  function compareFiles(
    a: DriveFile,
    b: DriveFile,
  ) {
    const dir =
      sortDir === "asc"
        ? 1
        : -1;

    switch (sortKey) {
      case "name":
        return (
          a.name.localeCompare(
            b.name,
          ) * dir
        );

      case "createdAt":
        return (
          (new Date(
            a.createdAt,
          ).getTime() -
            new Date(
              b.createdAt,
            ).getTime()) * dir
        );

      case "size":
        return (
          (a.size - b.size) * dir
        );

      case "type":
        return (
          getFileType(
            a.mimeType,
          ).localeCompare(
            getFileType(
              b.mimeType,
            ),
          ) * dir
        );

      default:
        return 0;
    }
  }

  const query =
    searchQuery
      .trim()
      .toLowerCase();

  const foldersThatAreVisible =
    (
      query
        ? folders.filter(
            (folder) =>
              folder.name
                .toLowerCase()
                .includes(query),
          )
        : folders
    )
      .slice()
      .sort(compareFolders);

  const filesThatAreVisible =
    (
      query
        ? files.filter(
            (file) =>
              file.name
                .toLowerCase()
                .includes(query),
          )
        : files
    )
      .slice()
      .sort(compareFiles);

  const showNavRows = Boolean(currentFolderId) && !query;
  const hasDriveContents = foldersThatAreVisible.length > 0 || filesThatAreVisible.length > 0 || showNavRows;

  return (
    <div className="h-dvh flex flex-col">
      <header className="bg-surface px-8 py-4 flex flex-row gap-12 items-center border-b border-(--surface-2)">
        <div>
          <img />

          <p className="text-2xl font-black">
            {currentFolderName ??
              "Your Drive"}
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 border rounded-lg border-(--surface-2) px-3 py-0.75 grow max-w-[50dvw] mx-auto">
          <SearchIcon size={16} />

          <input
            placeholder="Search in your Drive"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value,
              )
            }
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

          <button
            onClick={
              startCreateFolder
            }
            disabled={creatingFolder}
            className="flex flex-row gap-2 items-center bg-(--surface-2) rounded-lg! px-6! py-2.5! text-sm hover:bg-(--surface-3) transition-default disabled:opacity-50"
          >
            <FolderIcon size={20} />

            {creatingFolder
              ? "Creating..."
              : "New Folder"}
          </button>
        </div>

        {uploadError && (
          <p className="text-red-500">
            {uploadError}
          </p>
        )}

        <table className="w-full table-fixed text-left [&_td]:px-2 [&_td]:py-1.5 [&_td]:border-b-2 [&_td]:border-(--surface-2) [&_td]:text-lg">
          <colgroup>
            <col className="w-28" />
            <col />
            <col className="w-60" />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>

          <thead>
            <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:text-(--surface-3) [&>th]:border-b-2 [&>th]:border-(--surface-1)">
              <SortableHeader
                label="Type"
                sortKey="type"
                activeKey={
                  sortKey
                }
                activeDir={
                  sortDir
                }
                onSort={
                  handleSort
                }
              />

              <SortableHeader
                label="Name"
                sortKey="name"
                activeKey={
                  sortKey
                }
                activeDir={
                  sortDir
                }
                onSort={
                  handleSort
                }
              />

              <SortableHeader
                label="Uploaded"
                sortKey="createdAt"
                activeKey={
                  sortKey
                }
                activeDir={
                  sortDir
                }
                onSort={
                  handleSort
                }
              />

              <SortableHeader
                label="Size"
                sortKey="size"
                activeKey={
                  sortKey
                }
                activeDir={
                  sortDir
                }
                onSort={
                  handleSort
                }
              />

              <th>
                <p>Actions</p>
              </th>
            </tr>
          </thead>

          <tbody>
            {loadingFiles ? (
              <>
                <SkeletonRow
                  delay={0}
                />

                <SkeletonRow
                  delay={0.08}
                />

                <SkeletonRow
                  delay={0.16}
                />
              </>
            ) : !hasDriveContents && !creatingFolderInput ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-2 py-10 text-center text-(--surface-3)"
                >
                  {query
                    ? "No results found"
                    : "No files or folders yet. Upload something or create a folder 👀"}
                </td>
              </tr>
            ) : (
              <>
                {creatingFolderInput && (
                  <tr>
                    <td title="Folder">
                      FOLDER
                    </td>

                    <td colSpan={3}>
                      <div className="flex flex-row items-center gap-2">
                        <FolderIcon
                          size={18}
                        />

                        <input
                          ref={
                            newFolderInputRef
                          }
                          value={
                            newFolderName
                          }
                          disabled={
                            creatingFolder
                          }
                          onChange={(
                            event,
                          ) =>
                            setNewFolderName(
                              event.target
                                .value,
                            )
                          }
                          onKeyDown={(
                            event,
                          ) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              handleCreateFolder();
                            }

                            if (
                              event.key ===
                              "Escape"
                            ) {
                              cancelCreateFolder();
                            }
                          }}
                          onBlur={() => {
                            if (
                              !creatingFolder
                            ) {
                              handleCreateFolder();
                            }
                          }}
                          placeholder="Untitled folder"
                          className="rounded-md border border-(--surface-3) bg-(--surface-2) px-2 w-[calc-size(fit-content,size+48px)] pr-12 outline-none focus:border-(--surface-4) text-[16px]"
                        />

                        {creatingFolder && (
                          <span className="text-sm text-(--surface-3) whitespace-nowrap">
                            Creating...
                          </span>
                        )}
                      </div>
                    </td>

                    <td />
                  </tr>
                )}

                {currentFolderId && !query && (
                  <>
                    <tr>
                      <td title="Root">ROOT</td>
                      <td className="cursor-pointer truncate" onClick={handleGoToRoot}>
                        <div className="flex flex-row items-center gap-2">
                          <FolderIcon size={18} />
                          ..
                        </div>
                      </td>
                      <td />
                      <td />
                      <td />
                    </tr>

                    {folderHistory.length > 1 && (
                      <tr>
                        <td title="Back">BACK</td>
                        <td className="cursor-pointer truncate" onClick={handleGoBack}>
                          <div className="flex flex-row items-center gap-2">
                            <FolderIcon size={18} />
                            .
                          </div>
                        </td>
                        <td />
                        <td />
                        <td />
                      </tr>
                    )}
                  </>
                )}

                {foldersThatAreVisible.map(
                  (folder) => (
                    <tr
                      key={
                        folder.id
                      }
                    >
                      <td title="Folder">
                        FOLDER
                      </td>

                      <td
                        title={
                          folder.name
                        }
                        className="cursor-pointer truncate"
                        onClick={() =>
                          handleOpenFolder(
                            folder,
                          )
                        }
                      >
                        <div className="flex flex-row items-center gap-2">
                          <FolderIcon
                            size={18}
                          />

                          {
                            folder.name
                          }
                        </div>
                      </td>

                      <td
                        title={new Date(
                          folder.createdAt,
                        ).toString()}
                      >
                        {formatDate(
                          folder.createdAt,
                        )}
                      </td>

                      <td/>

                      <td>
                        <div className="relative flex flex-row items-center">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId ===
                                  `folder-${folder.id}`
                                  ? null
                                  : `folder-${folder.id}`,
                              )
                            }
                            className="p-0!"
                            aria-label="Folder options"
                          >
                            <MoreHorizontalIcon
                              size={20}
                            />
                          </button>

                          {openMenuId ===
                            `folder-${folder.id}` && (
                            <div className="absolute right-0 top-7 z-50 min-w-40 rounded-lg border border-(--surface-2) bg-surface shadow-lg">
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-(--surface-2)"
                                onClick={() =>
                                  handleOpenFolder(
                                    folder,
                                  )
                                }
                              >
                                Open
                              </button>

                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-(--surface-2)"
                                onClick={() =>
                                  handleRenameFolder(
                                    folder,
                                  )
                                }
                              >
                                Rename
                              </button>

                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-(--surface-2)"
                                onClick={() => {
                                  console.log(
                                    "Cut folder:",
                                    folder.id,
                                  );

                                  setOpenMenuId(
                                    null,
                                  );
                                }}
                              >
                                Cut
                              </button>

                              <button
                                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                                onClick={() =>
                                  handleDeleteFolder(
                                    folder,
                                  )
                                }
                                disabled={
                                  deletingFolderId ===
                                  folder.id
                                }
                              >
                                {deletingFolderId ===
                                folder.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}

                {filesThatAreVisible.map(
                  (file) => (
                    <tr
                      key={file.id}
                    >
                      <td
                        title={
                          file.mimeType
                        }
                        className="truncate"
                      >
                        {getFileType(
                          file.mimeType,
                        )}
                      </td>

                      <td
                        title={
                          editingFileId ===
                          file.id
                            ? undefined
                            : file.name
                        }
                        className="truncate"
                      >
                        {editingFileId ===
                        file.id ? (
                          <div className="flex flex-row items-center gap-2">
                            <input
                              ref={
                                renameInputRef
                              }
                              value={
                                renameValue
                              }
                              disabled={
                                renaming
                              }
                              onChange={(
                                event,
                              ) =>
                                setRenameValue(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              onKeyDown={(
                                event,
                              ) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  handleRename(
                                    file,
                                  );
                                }

                                if (
                                  event.key ===
                                  "Escape"
                                ) {
                                  cancelRename();
                                }
                              }}
                              onBlur={() => {
                                if (
                                  !renaming
                                ) {
                                  handleRename(
                                    file,
                                  );
                                }
                              }}
                              className="rounded-md border border-(--surface-3) bg-(--surface-2) px-2 w-[calc-size(fit-content,size+48px)] pr-12 outline-none focus:border-(--surface-4) text-[16px]"
                            />

                            {renaming && (
                              <span className="text-sm text-(--surface-3) whitespace-nowrap">
                                Renaming...
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            {
                              splitFileName(
                                file.name,
                              ).base
                            }

                            <span className="text-(--surface-3)">
                              {
                                splitFileName(
                                  file.name,
                                ).ext
                              }
                            </span>
                          </>
                        )}
                      </td>

                      <td
                        title={new Date(
                          file.createdAt,
                        ).toString()}
                        className="truncate"
                      >
                        {formatDate(
                          file.createdAt,
                        )}
                      </td>

                      <td
                        title={`${file.size} bytes`}
                        className="truncate"
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
                            className="p-0!"
                            aria-label="File options"
                          >
                            <MoreHorizontalIcon
                              size={20}
                            />
                          </button>

                          {openMenuId ===
                            file.id && (
                            <div className="absolute right-0 top-7 z-50 min-w-40 rounded-lg border border-(--surface-2) bg-surface shadow-lg">
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
                                  startRename(
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
                )}
              </>
            )}
          </tbody>
        </table>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
