
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  fileCount: number;
  storageBytes: number;
  providers: string[];
};

type UserResponse = {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(index ? 2 : 0)} ${units[index]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function UsersTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (query: string, currentPage: number) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
      });

      if (query.trim()) params.set("search", query.trim());

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "You are not authorized to view users."
            : "Unable to load users. Please try again.",
        );
      }

      const result = (await response.json()) as UserResponse;
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      void loadUsers(search, 1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, loadUsers]);

  function changePage(nextPage: number) {
    setPage(nextPage);
    void loadUsers(search, nextPage);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-surface">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">All users</h2>
          <p className="mt-1 text-sm text-white/45">
            {data ? `${data.pagination.total.toLocaleString()} accounts` : "Account directory"}
          </p>
        </div>

        <label className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 sm:max-w-sm">
          <Search size={17} className="shrink-0 text-white/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email..."
            aria-label="Search users by name or email"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
          />
        </label>
      </div>

      {error ? (
        <div className="p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => void loadUsers(search, page)}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      ) : loading && !data ? (
        <div className="p-12 text-center text-sm text-white/45">
          Loading users...
        </div>
      ) : data && data.users.length === 0 ? (
        <div className="p-12 text-center">
          <Users size={26} className="mx-auto text-white/35" />
          <p className="mt-3 font-medium">No users found</p>
          <p className="mt-1 text-sm text-white/45">
            Try a different name or email.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-white/[0.02] text-xs text-white/45">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Providers</th>
                  <th className="px-5 py-3 font-medium">Files</th>
                  <th className="px-5 py-3 font-medium">Storage</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data?.users.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/users/${encodeURIComponent(item.id)}`}
                        className="font-medium transition hover:text-accent hover:underline"
                      >
                        {item.name || "Unnamed user"}
                      </Link>
                      <p className="mt-1 text-xs text-white/45">{item.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {item.emailVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle2 size={14} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                          <CircleX size={14} /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.providers.length ? (
                          item.providers.map((provider) => (
                            <span
                              key={provider}
                              className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/65"
                            >
                              {provider}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-white/35">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 tabular-nums">{item.fileCount}</td>
                    <td className="px-5 py-4 whitespace-nowrap tabular-nums">
                      {formatBytes(item.storageBytes)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-white/55">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
            <p className="text-xs text-white/45">
              {data
                ? `Page ${data.pagination.page} of ${Math.max(1, data.pagination.totalPages)}`
                : ""}
              {loading ? " · Updating..." : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="rounded-lg border border-white/10 p-2 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() => changePage(page + 1)}
                disabled={!data || page >= data.pagination.totalPages || loading}
                aria-label="Next page"
                className="rounded-lg border border-white/10 p-2 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
