"use client";

import { useCallback, useEffect, useState } from "react";

type AuditEntry = {
  id: string;
  action: string;
  actorUserId: string;
  actorName: string | null;
  actorEmail: string | null;
  targetUserId: string | null;
  targetName: string | null;
  targetEmail: string | null;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
};

type AuditResponse = {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatValue(value: string | null) {
  if (!value) return "None";

  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

export default function AuditLog() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
      });

      const response = await fetch(`/api/admin/audit?${params}`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to load the audit log.");
      }

      setData(result);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load the audit log.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-surface p-5">
          <p className="text-sm text-white/50">Matching events</p>
          <p className="mt-3 text-2xl font-semibold">
            {data?.total.toLocaleString() ?? "…"}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-5">
          <p className="text-sm text-white/50">Page</p>
          <p className="mt-3 text-2xl font-semibold">
            {data ? `${data.page} / ${Math.max(data.totalPages, 1)}` : "…"}
          </p>
        </section>
      </div>

      <input
        className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3"
        placeholder="Search actions, user IDs, or recorded values"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />

      {error && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
          role="alert"
        >
          <span>{error}</span>
          <button
            className="rounded-lg border border-white/15 px-3 py-2 text-white"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-white/50">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Action</th>
              <th className="p-4">Administrator</th>
              <th className="p-4">Target</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {data?.entries.map((entry) => (
              <tr key={entry.id} className="align-top">
                <td className="whitespace-nowrap p-4 text-white/60">
                  {formatDate(entry.createdAt)}
                </td>

                <td className="p-4">
                  <span className="inline-flex rounded-lg border border-white/10 px-2.5 py-1 font-medium">
                    {entry.action}
                  </span>
                </td>

                <td className="p-4">
                  <p>{entry.actorName || "Unknown administrator"}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {entry.actorEmail || entry.actorUserId}
                  </p>
                </td>

                <td className="p-4">
                  {entry.targetUserId ? (
                    <>
                      <p>{entry.targetName || "Unknown user"}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {entry.targetEmail || entry.targetUserId}
                      </p>
                    </>
                  ) : (
                    <span className="text-white/40">No target</span>
                  )}
                </td>

                <td className="p-4">
                  {entry.previousValue || entry.newValue ? (
                    <button
                      className="rounded-lg border border-white/15 px-3 py-2 hover:bg-white/5"
                      onClick={() =>
                        setExpanded(expanded === entry.id ? null : entry.id)
                      }
                    >
                      {expanded === entry.id ? "Hide" : "View"}
                    </button>
                  ) : (
                    <span className="text-white/40">No details</span>
                  )}

                  {expanded === entry.id && (
                    <div className="mt-3 min-w-64 space-y-3">
                      <div>
                        <p className="mb-1 text-xs font-medium text-white/50">
                          Previous value
                        </p>
                        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs">
                          {formatValue(entry.previousValue)}
                        </pre>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-medium text-white/50">
                          New value
                        </p>
                        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs">
                          {formatValue(entry.newValue)}
                        </pre>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {!loading && data?.entries.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/45">
                  No audit events found.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/45">
                  Loading audit events...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/45">
          Showing {data?.entries.length ?? 0} of{" "}
          {data?.total.toLocaleString() ?? 0} events
        </p>

        <div className="flex gap-2">
          <button
            className="rounded-lg border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>

          <button
            className="rounded-lg border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
            disabled={
              loading ||
              !data ||
              page >= data.totalPages
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
