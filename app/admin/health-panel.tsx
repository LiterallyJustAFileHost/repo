"use client";

import { useCallback, useEffect, useState } from "react";

type HealthCheck = {
  status: "healthy" | "degraded" | "unavailable";
  latencyMs: number | null;
  message: string;
};

type HealthData = {
  checkedAt: string;
  overallStatus: string;
  application: {
    status: string;
    environment: string;
    uptimeSeconds: number;
    nodeVersion: string;
  };
  checks: {
    database: HealthCheck;
    googleDrive: HealthCheck;
  };
};

function formatDuration(seconds: number) {
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

function StatusLabel({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    degraded: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    unavailable: "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? "border-white/10 text-white/60"}`}
    >
      {status}
    </span>
  );
}

function ServiceCard({
  title,
  check,
}: {
  title: string;
  check: HealthCheck;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <StatusLabel status={check.status} />
      </div>
      <p className="mt-4 text-sm text-white/60">{check.message}</p>
      <p className="mt-3 text-xs text-white/40">
        Response time:{" "}
        {check.latencyMs === null ? "Unavailable" : `${check.latencyMs} ms`}
      </p>
    </section>
  );
}

export default function HealthPanel() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/health", {
        cache: "no-store",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to load system health.");
      }

      setData(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load system health.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/50">Overall status</p>
          <div className="mt-2">
            {data ? (
              <StatusLabel status={data.overallStatus} />
            ) : (
              <span className="text-sm text-white/50">
                {loading ? "Checking services..." : "Status unavailable"}
              </span>
            )}
          </div>
          {data && (
            <p className="mt-2 text-xs text-white/40">
              Last checked {new Date(data.checkedAt).toLocaleString()}
            </p>
          )}
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh checks"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data && (
          <>
            <ServiceCard title="PostgreSQL" check={data.checks.database} />
            <ServiceCard title="Google Drive" check={data.checks.googleDrive} />
          </>
        )}
      </div>

      {data && (
        <section className="rounded-2xl border border-white/10 bg-surface p-5">
          <h2 className="font-semibold">Application runtime</h2>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-white/45">Environment</dt>
              <dd className="mt-1 font-medium">{data.application.environment}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/45">Process uptime</dt>
              <dd className="mt-1 font-medium">
                {formatDuration(data.application.uptimeSeconds)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-white/45">Node.js</dt>
              <dd className="mt-1 font-medium">{data.application.nodeVersion}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/45">Health checks</dt>
              <dd className="mt-1 font-medium">2 services</dd>
            </div>
          </dl>
        </section>
      )}

      {!data && loading && (
        <div className="rounded-2xl border border-white/10 bg-surface p-8 text-sm text-white/50">
          Checking database and Google Drive connectivity...
        </div>
      )}
    </div>
  );
}
