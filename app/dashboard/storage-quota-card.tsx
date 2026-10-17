"use client";

import { useCallback, useEffect, useState } from "react";
import { HardDrive, RefreshCw } from "lucide-react";

type StorageQuota = {
  usedBytes: number;
  reservedBytes: number;
  totalUsedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  usagePercent: number;
  fileCount: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = -1;

  do {
    size /= 1024;
    unit++;
  } while (size >= 1024 && unit < units.length - 1);

  return `${size.toFixed(1)} ${units[unit]}`;
}

export function StorageQuotaCard() {
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadQuota = useCallback(async () => {
    try {
      const response = await fetch("/api/files/quota", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to load quota");

      setQuota(await response.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuota();

    function handleStorageChange() {
      void loadQuota();
    }

    window.addEventListener("storage-quota-refresh", handleStorageChange);

    return () => {
      window.removeEventListener("storage-quota-refresh", handleStorageChange);
    };
  }, [loadQuota]);

  const usedPercent = Math.min(100, Math.max(0, quota?.usagePercent ?? 0));
  const isNearLimit = usedPercent >= 85;

  
  
    return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-(--surface-2) px-3 py-2">
        <div className="flex shrink-0 items-center gap-2">
        <HardDrive size={16} className="text-(--foreground-muted)" />
        <span className="text-sm font-medium">Storage</span>
        </div>

        <div className="min-w-0 flex-1 text-center">
        {loading ? (
            <span className="text-sm text-(--foreground-muted)">Loading...</span>
        ) : error || !quota ? (
            <span className="text-sm text-(--foreground-muted)">Unavailable</span>
        ) : (
            <span className="whitespace-nowrap text-sm text-(--foreground-muted)">
            {formatBytes(quota.totalUsedBytes)} / {formatBytes(quota.quotaBytes)}
            </span>
        )}
        </div>

        <button
        type="button"
        onClick={() => {
            setLoading(true);
            void loadQuota();
        }}
        disabled={loading}
        aria-label="Refresh storage usage"
        className="shrink-0 rounded-md p-1 text-(--foreground-muted) transition hover:bg-(--surface-2) hover:text-foreground disabled:opacity-50"
        >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
    </div>
    );
}
