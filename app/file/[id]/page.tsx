"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DownloadIcon, UserIcon } from "lucide-react";
import { Footer } from "@/app/components/footer";

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
  ownerName: string | null;
  ownerEmail: string | null;
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
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
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
        setOwnerName(data.ownerName);
        setOwnerEmail(data.ownerEmail);
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);

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
    <div className="flex flex-col h-dvh">
      <div className="px-[15dvw] py-8 flex flex-row gap-[2dvw]">
        <div className="grow-2">
          <h1 className="text-2xl underline underline-offset-6 decoration-(--surface-4) font-bold">Files</h1>
          <div className="flex flex-row mt-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-medium">{file.name} <span className="text-sm text-(--surface-4)">{formatFileSize(file.size)}</span></h2>
              <div className="flex flex-row">
                <p className="text-sm flex flex-row items-center gap-1 text-(--surface-3)"><UserIcon size={16} /> {ownerName ?? ownerEmail ?? "Unknown"}</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="main-button flex flex-row gap-1.5 items-center ml-auto mb-auto font-bold"
            >
              <DownloadIcon size={20} /> Download
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start grow [&>div]:flex [&>div]:flex-col [&>div]:gap-1.5">
          <h1 className="text-2xl underline underline-offset-6 decoration-(--surface-4) font-bold">File Details</h1>
          <div>
            <h2 className="text-xl underline underline-offset-6 decoration-(--surface-4) font-medium text-(--surface-4)">Created</h2>
            <p>{formatDate(file.createdAt)}</p>
          </div>
          <div>
            <h2 className="text-xl underline underline-offset-6 decoration-(--surface-4) font-medium text-(--surface-4)">Mime Type</h2>
            <p>{file.mimeType}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
