"use client";

import { useCallback, useEffect, useState } from "react";

type Admin = {
  id: string;
  name: string;
  email: string;
  source: "environment" | "database";
  grantedBy: string | null;
  createdAt: string | null;
  protected: boolean;
};

export default function RolesTable() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/roles");
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load admin roles.");
      }

      setAdmins(data.admins ?? []);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load admin roles.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to grant admin access.");
      }

      setEmail("");
      setMessage("Administrator access granted.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to grant admin access.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeAdmin(admin: Admin) {
    if (busy || admin.protected) return;

    const confirmed = window.confirm(
      `Remove administrator access for ${admin.email}?`,
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: admin.id }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to revoke admin access.");
      }

      setMessage("Administrator access revoked.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to revoke admin access.",
      );
    } finally {
      setBusy(false);
    }
  }

  const filteredAdmins = admins.filter((admin) => {
    const query = search.toLowerCase();

    return (
      admin.email.toLowerCase().includes(query) ||
      admin.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-surface p-5">
          <p className="text-sm text-white/50">Administrators</p>
          <p className="mt-3 text-2xl font-semibold">{admins.length}</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-surface p-5">
          <p className="text-sm text-white/50">Environment protected</p>
          <p className="mt-3 text-2xl font-semibold">
            {admins.filter((admin) => admin.source === "environment").length}
          </p>
        </section>
      </div>

      <form
        onSubmit={addAdmin}
        className="rounded-2xl border border-white/10 bg-surface p-5"
      >
        <h2 className="font-semibold">Grant administrator access</h2>
        <p className="mt-1 text-sm text-white/50">
          The person must already have an account.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-background px-4 py-3"
            type="email"
            required
            maxLength={320}
            placeholder="user@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy || !email.trim()}
          >
            Grant access
          </button>
        </div>
      </form>

      <input
        className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3"
        placeholder="Search administrators"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-white/50">
            <tr>
              <th className="p-4">Administrator</th>
              <th className="p-4">Source</th>
              <th className="p-4">Added</th>
              <th className="p-4">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredAdmins.map((admin) => (
              <tr key={admin.id}>
                <td className="p-4">
                  <p className="font-medium">{admin.name || "Unnamed user"}</p>
                  <p className="mt-1 text-xs text-white/45">{admin.email}</p>
                </td>
                <td className="p-4">
                  {admin.source === "environment"
                    ? "Environment"
                    : "Database"}
                </td>
                <td className="p-4 text-white/60">
                  {admin.createdAt
                    ? new Date(admin.createdAt).toLocaleDateString()
                    : "Deployment config"}
                </td>
                <td className="p-4">
                  {admin.protected ? (
                    <span className="text-xs text-white/45">Protected</span>
                  ) : (
                    <button
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void removeAdmin(admin)}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && filteredAdmins.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-white/45">
                  No administrators found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-white/45">
                  Loading administrator roles...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {message && (
        <p aria-live="polite" className="text-sm text-white/70">
          {message}
        </p>
      )}
    </div>
  );
}
