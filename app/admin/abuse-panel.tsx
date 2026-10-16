"use client";

import { useCallback, useEffect, useState } from "react";

type Entry = {
  id: string;
  action: string;
  targetUserId: string | null;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  actorEmail: string | null;
  actorName: string | null;
};

type AbuseData = {
  entries: Entry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  periodDays: number;
  actionCounts: { action: string; count: number }[];
};

export default function AbusePanel() {
  const [data, setData] = useState<AbuseData | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        q: query,
      });
      const response = await fetch(`/api/admin/abuse?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to load abuse activity.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Abuse prevention</h2>
        <p className="text-sm text-muted-foreground">
          Review relevant administrative actions from the last 30 days.
          This is an audit-based view, not automated abuse detection.
        </p>
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">Matching events</p>
        <p className="text-2xl font-semibold">{data?.total ?? "..."}</p>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </div>

      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="Search action, user, or email"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <button
          className="rounded-lg border px-4 py-2 text-sm"
          onClick={() => void load()}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="p-3">Action</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Target user</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={4}>
                  Loading activity...
                </td>
              </tr>
            )}
            {!loading && data?.entries.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={4}>
                  No matching activity found.
                </td>
              </tr>
            )}
            {!loading &&
              data?.entries.map((entry) => (
                <tr className="border-b last:border-0" key={entry.id}>
                  <td className="p-3">
                    <div className="font-medium">{entry.action}</div>
                    {(entry.previousValue || entry.newValue) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          View changes
                        </summary>
                        <pre className="mt-2 max-w-sm whitespace-pre-wrap break-words text-xs">
                          {JSON.stringify(
                            {
                              previous: entry.previousValue,
                              next: entry.newValue,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="p-3">
                    {entry.actorName || entry.actorEmail || "Unknown"}
                  </td>
                  <td className="p-3 break-all">
                    {entry.targetUserId || "None"}
                  </td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Page {data?.page ?? page} of {data?.totalPages ?? 1}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border px-3 py-2"
            disabled={loading || page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <button
            className="rounded-lg border px-3 py-2"
            disabled={loading || page >= (data?.totalPages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
