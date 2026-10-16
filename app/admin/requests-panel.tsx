"use client";

import { useCallback, useEffect, useState } from "react";

type PrivacyRequest = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

type RequestData = {
  requests: PrivacyRequest[];
  total: number;
  page: number;
  totalPages: number;
};

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

export default function RequestsPanel() {
  const [data, setData] = useState<RequestData | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        q: query,
        status,
      });
      const response = await fetch(`/api/admin/requests?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to load requests.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateRequest(id: string, nextStatus: string, notes: string | null) {
    setSaving(id);
    setError("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus, notes }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to update request.");
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-surface p-5">
        <p className="text-sm text-white/55">Total matching requests</p>
        <p className="mt-2 text-3xl font-semibold">{data?.total ?? "..."}</p>
        <p className="mt-1 text-xs text-white/40">
          Requests are tracked here. Changing status does not execute an export or deletion.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-background px-3 py-2 text-sm"
          placeholder="Search by user or request type"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="rounded-xl border border-white/10 bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5"
          onClick={() => void load()}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {loading && (
          <div className="rounded-xl border border-white/10 p-5 text-sm text-white/50">
            Loading requests...
          </div>
        )}

        {!loading && data?.requests.length === 0 && (
          <div className="rounded-xl border border-white/10 p-8 text-center">
            <p className="font-medium">No privacy requests found</p>
            <p className="mt-1 text-sm text-white/45">
              Requests will appear here once a submission flow is connected.
            </p>
          </div>
        )}

        {!loading &&
          data?.requests.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-surface p-5"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <p className="font-medium">
                    {item.type === "export" ? "Data export" : item.type === "deletion" ? "Account deletion" : item.type}
                  </p>
                  <p className="mt-1 break-all text-sm text-white/55">
                    {item.name || "Unnamed user"} · {item.email || item.userId}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Submitted {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-3 text-xs text-white/40">Request ID: {item.id}</p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:w-44">
                  <select
                    className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
                    value={item.status}
                    disabled={saving === item.id}
                    onChange={(event) =>
                      void updateRequest(item.id, event.target.value, item.notes)
                    }
                  >
                    {statuses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-white/40">
                    {saving === item.id ? "Saving..." : "Status"}
                  </span>
                </div>
              </div>
              {item.notes && (
                <p className="mt-4 whitespace-pre-wrap border-t border-white/10 pt-3 text-sm text-white/60">
                  {item.notes}
                </p>
              )}
            </article>
          ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/45">
          Page {data?.page ?? page} of {data?.totalPages ?? 1}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-white/10 px-3 py-2"
            disabled={loading || page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <button
            className="rounded-lg border border-white/10 px-3 py-2"
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
