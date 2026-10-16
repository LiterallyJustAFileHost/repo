"use client";

import { useCallback, useEffect, useState } from "react";

type QuotaUser = {
  id: string;
  name: string;
  email: string;
  suspended: boolean;
  customQuotaBytes: number | null;
  quotaReason: string | null;
  isHackClub: boolean;
  usedBytes: number;
  fileCount: number;
  defaultQuotaBytes: number;
  effectiveQuotaBytes: number;
};

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4);

  return `${(bytes / 1024 ** index).toFixed(index ? 2 : 0)} ${units[index]}`;
}

export default function QuotasTable() {
  const [users, setUsers] = useState<QuotaUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<QuotaUser | null>(null);
  const [quota, setQuota] = useState("25");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/quotas?search=${encodeURIComponent(search)}`,
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load quotas.");
      }

      setUsers(Array.isArray(data?.users) ? data.users : []);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load quotas.",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(reset = false) {
    if (!selected || busy) return;

    const quotaGb = Number(quota);

    if (
      !reset &&
      (!Number.isFinite(quotaGb) ||
        quotaGb <= 0 ||
        !Number.isSafeInteger(Math.round(quotaGb * 1024 ** 3)))
    ) {
      setMessage("Enter a valid quota greater than 0 GB.");
      return;
    }

    if (!reset && !reason.trim()) {
      setMessage("Enter a reason for the quota change.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/quotas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          reset,
          quotaBytes: Math.round(quotaGb * 1024 ** 3),
          reason: reason.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update quota.");
      }

      setSelected(null);
      setReason("");
      setMessage("Quota updated successfully.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update quota.",
      );
    } finally {
      setBusy(false);
    }
  }

  const customQuotaCount = users.filter(
    (item) => item.customQuotaBytes !== null,
  ).length;

  const totalUsedBytes = users.reduce(
    (total, item) => total + item.usedBytes,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <p className="text-sm text-white/50">Accounts loaded</p>
          <p className="mt-3 text-2xl font-semibold">{users.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <p className="text-sm text-white/50">Storage used by loaded users</p>
          <p className="mt-3 text-2xl font-semibold">
            {formatBytes(totalUsedBytes)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <p className="text-sm text-white/50">Custom quotas</p>
          <p className="mt-3 text-2xl font-semibold">{customQuotaCount}</p>
        </div>
      </div>

      <input
        className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3"
        placeholder="Search users by name or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-white/50">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Storage</th>
              <th className="p-4">Quota</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {users.map((item) => (
              <tr key={item.id}>
                <td className="p-4">
                  <p className="font-medium">
                    {item.name || "Unnamed user"}
                  </p>
                  <p className="mt-1 text-xs text-white/45">{item.email}</p>
                  {item.suspended && (
                    <p className="mt-1 text-xs text-red-400">Suspended</p>
                  )}
                </td>

                <td className="p-4">
                  {item.isHackClub ? "Hack Club linked" : "Standard"}
                </td>

                <td className="p-4">
                  {formatBytes(item.usedBytes)}
                  <p className="mt-1 text-xs text-white/45">
                    {item.fileCount} files
                  </p>
                </td>

                <td className="p-4">
                  {formatBytes(item.effectiveQuotaBytes)}
                  {item.customQuotaBytes !== null && (
                    <p className="mt-1 text-xs text-accent">Custom</p>
                  )}
                  {item.usedBytes > item.effectiveQuotaBytes && (
                    <p className="mt-1 text-xs text-red-400">Over quota</p>
                  )}
                </td>

                <td className="p-4">
                  <button
                    className="rounded-lg border border-white/15 px-3 py-2 hover:bg-white/5"
                    onClick={() => {
                      setSelected(item);
                      setQuota(
                        String(
                          item.effectiveQuotaBytes / 1024 ** 3,
                        ),
                      );
                      setReason(item.quotaReason ?? "");
                      setMessage("");
                    }}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}

            {!loading && users.length === 0 && (
              <tr>
                <td className="p-6 text-white/45" colSpan={5}>
                  No matching users found.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td className="p-6 text-white/45" colSpan={5}>
                  Loading quotas...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Manage quota</h2>
              <p className="mt-1 text-sm text-white/50">{selected.email}</p>
            </div>

            <button
              className="text-sm text-white/50 hover:text-white"
              onClick={() => setSelected(null)}
              disabled={busy}
            >
              Close
            </button>
          </div>

          <p className="mt-4 text-sm text-white/60">
            Default: {formatBytes(selected.defaultQuotaBytes)}. Current usage:{" "}
            {formatBytes(selected.usedBytes)}.
          </p>

          <label className="mt-5 block text-sm">
            Custom quota in GB
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-2"
              type="number"
              min="0.01"
              step="0.25"
              value={quota}
              onChange={(event) => setQuota(event.target.value)}
            />
          </label>

          <label className="mt-4 block text-sm">
            Reason for change
            <textarea
              className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-2"
              rows={3}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this custom quota needed?"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={
                busy ||
                !reason.trim() ||
                !Number.isFinite(Number(quota)) ||
                Number(quota) <= 0 ||
                !Number.isSafeInteger(
                  Math.round(Number(quota) * 1024 ** 3),
                )
              }
              onClick={() => void save()}
            >
              {busy ? "Saving..." : "Save custom quota"}
            </button>

            {selected.customQuotaBytes !== null && (
              <button
                className="rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
                disabled={busy}
                onClick={() => void save(true)}
              >
                Reset to default
              </button>
            )}
          </div>
        </section>
      )}

      {message && (
        <p aria-live="polite" className="text-sm text-white/70">
          {message}
        </p>
      )}
    </div>
  );
}
