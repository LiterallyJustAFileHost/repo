"use client";

import { useCallback, useEffect, useState } from "react";

type SettingsData = {
  application: {
    name: string;
    environment: string;
    nodeVersion: string;
    uptimeSeconds: number;
    configuredAt: string;
  };
  configuration: {
    name: string;
    configured: boolean;
    detail: string;
  }[];
};

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    `${minutes}m`,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function SettingsPanel() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/settings");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to load settings.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="rounded-2xl border border-white/10 bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Application</h2>
            <p className="mt-1 text-sm text-white/45">
              Runtime and deployment information
            </p>
          </div>
          <button
            className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5"
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 divide-y divide-white/10">
          {[
            ["Application name", data?.application.name],
            ["Environment", data?.application.environment],
            ["Node.js version", data?.application.nodeVersion],
            [
              "Process uptime",
              data ? formatUptime(data.application.uptimeSeconds) : undefined,
            ],
          ].map(([label, value]) => (
            <div
              className="flex flex-wrap justify-between gap-2 py-4 first:pt-0 last:pb-0"
              key={label}
            >
              <span className="text-sm text-white/55">{label}</span>
              <span className="text-sm font-medium">{loading ? "Loading..." : value ?? "Unavailable"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="font-semibold">Integrations & configuration</h2>
        <p className="mt-1 text-sm text-white/45">
          Configuration presence only. Secret values are never displayed.
        </p>

        <div className="mt-5 divide-y divide-white/10">
          {loading && (
            <p className="py-4 text-sm text-white/45">Loading configuration...</p>
          )}

          {!loading &&
            data?.configuration.map((item) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                key={item.name}
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-xs text-white/45">{item.detail}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    item.configured
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {item.configured ? "Configured" : "Not configured"}
                </span>
              </div>
            ))}
        </div>
      </section>

      <p className="text-xs text-white/35">
        These settings are informational. Changes to environment variables must be made in your deployment configuration.
      </p>
    </div>
  );
}
