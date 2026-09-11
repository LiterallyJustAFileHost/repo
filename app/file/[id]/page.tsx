"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
}

type ShareResponse = {
  file: DriveFile;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1000, index);

  return `${size.toFixed(index === 0 ? 0 : 1)}${units[index]}`;
}

export default function SharedFilePage() {
  const params = useParams<{ id: string }>();
  const shareId = params.id;

  const [file, setFile] = useState<DriveFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/share/${shareId}`);
        if (response.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!response.ok) throw new Error("Failed to load file");

        const data: ShareResponse = await response.json();
        if (cancelled) return;

        setFile(data.file);
      } catch (error) {
        console.warn("Failed to load shared file:", error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    }
  }, [shareId]);

  function handleDownload() {
    window.location.href = `/api/share/${shareId}/download`;
  }

  if (loading) {
    return (
      <div className="px-[15dvw] py-8">
        <h1 className="text-2xl underline underline-offset-6 decoration-(--surface-4) font-bold">Files</h1>
        <p className="text-(--surface-4) mt-4">Loading...</p>
      </div>
    )
  }

  if (notFound || !file) {
    return (
      <div className="px-[15dvw] py-8">
        <h1 className="text-2xl underline underline-offset-6 decoration-(--surface-4) font-bold">Files</h1>
        <p className="text-(--surface-4) mt-4">This file doesn&apos;t exist or the link is no longer valid.</p>
      </div>
    )
  }

  return (
    <div className="px-[15dvw] py-8">
      <h1 className="text-2xl underline underline-offset-6 decoration-(--surface-4) font-bold">Files</h1>
      <div className="flex flex-col gap-2 mt-4">
        <h2 className="text-lg font-medium">{file.name} <span className="text-sm text-(--surface-4)">{formatFileSize(file.size)}</span></h2>
        <button onClick={handleDownload} className="main-button ml-auto">Download</button>
      </div>
    </div>
  );
}
