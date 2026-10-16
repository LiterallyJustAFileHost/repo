import Link from "next/link";
import {
  count,
  desc,
  eq,
  sum,
} from "drizzle-orm";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  FileText,
  Folder,
  HardDrive,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { db } from "@/db";
import { files, folders, customQuotas } from "@/db/schema";
import { user, account } from "@/auth-schema";

import UsersTable from "./users-table";
import QuotasTable from "./quotas-table";
import AuditLog from "./audit-log";
import RolesTable from "./roles-table";
import HealthPanel from "./health-panel";
import AbusePanel from "./abuse-panel";
import RequestsPanel from "./requests-panel";
import SettingsPanel from "./settings-panel";

const sections = {
  users: {
    title: "User management",
    description: "Search accounts, review account details, and manage account-level settings.",
  },
  quotas: {
    title: "Storage & quotas",
    description: "Manage default quotas, custom allocations, and storage usage.",
  },
  roles: {
    title: "Admin roles",
    description: "Manage administrator access and permissions.",
  },
  audit: {
    title: "Audit log",
    description: "Review administrative actions and their outcomes.",
  },
  health: {
    title: "System health",
    description: "Monitor database connectivity, storage services, and application performance.",
  },
  abuse: {
    title: "Abuse prevention",
    description: "Configure rate limits and review aggregate abuse indicators.",
  },
  requests: {
    title: "Privacy requests",
    description: "Manage account data export and deletion requests.",
  },
  settings: {
    title: "Settings",
    description: "Configure service defaults and review deployment information.",
  },
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

function formatDate(date: Date | string | null) {
  if (!date) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">{title}</p>
        <Icon size={19} className="text-white/45" />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-white/45">{description}</p>
    </section>
  );
}

function QuickLink({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-white/10 p-4 transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
        <Icon size={19} className="text-white/70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
      <ArrowRight
        size={17}
        className="shrink-0 text-white/35 transition group-hover:translate-x-1 group-hover:text-white/70"
      />
    </Link>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section = "overview" } = await searchParams;

  if (section !== "overview") {
    const selected = sections[section as keyof typeof sections];

    if (section === "users") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              User management
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Search accounts and review their storage usage and login providers.
            </p>
          </div>
          <UsersTable />
        </main>
      );
    }

    if (section === "quotas") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Storage & quotas
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Review storage usage and manage account allocations.
            </p>
          </div>
          <QuotasTable />
        </main>
      );
    }

    if (section === "roles") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Admin roles
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Manage administrator access and review protected accounts.
            </p>
          </div>
          <RolesTable />
        </main>
      );
    }

    if (section === "audit") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Audit log
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Review administrative actions, affected accounts, and recorded changes.
            </p>
          </div>
          <AuditLog />
        </main>
      );
    }

    if (section === "health") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              System health
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Check database connectivity, storage services, and application runtime.
            </p>
          </div>
          <HealthPanel />
        </main>
      );
    }

    
    if (section === "abuse") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Abuse prevention
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Configure rate limits and review aggregate abuse indicators.
            </p>
          </div>
          <AbusePanel />
        </main>
      );
    }

    if (section === "requests") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Privacy requests
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Review account data export and deletion requests.
            </p>
          </div>
          <RequestsPanel />
        </main>
      );
    }

    if (section === "settings") {
      return (
        <main className="mx-auto max-w-7xl p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">ADMINISTRATION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Settings
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Review application configuration and deployment details.
            </p>
          </div>
          <SettingsPanel />
        </main>
      );
    }

    if (!selected) {
      return (
        <main className="p-8 lg:p-10">
          <h1 className="text-2xl font-semibold">Section not found</h1>
          <Link href="/admin" className="mt-4 inline-block text-accent">
            Return to overview
          </Link>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-6xl p-6 lg:p-10">
        <div className="mb-8">
          <p className="text-sm text-accent">ADMINISTRATION</p>
          <h1 className="mt-2 text-3xl font-semibold">{selected.title}</h1>
          <p className="mt-3 text-white/55">{selected.description}</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-surface p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/5">
            <Activity size={23} className="text-white/70" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Not implemented yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
            This section is part of the admin panel roadmap. Its controls
            will appear here when the required backend operations and
            permission checks are implemented.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Back to overview
          </Link>
        </section>
      </main>
    );
  }

  const [
    [userStats],
    [fileStats],
    [folderStats],
    [quotaStats],
    [hackClubStats],
    recentUsers,
  ] = await Promise.all([
    db.select({ total: count() }).from(user),
    db.select({ total: count(), bytes: sum(files.size) }).from(files),
    db.select({ total: count() }).from(folders),
    db.select({ total: count() }).from(customQuotas),
    db
      .select({ total: count() })
      .from(account)
      .where(eq(account.providerId, "hackclub")),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(6),
  ]);

  const cards = [
    {
      title: "Total users",
      value: userStats.total.toLocaleString(),
      description: "Registered accounts",
      icon: Users,
    },
    {
      title: "Storage used",
      value: formatBytes(Number(fileStats.bytes ?? 0)),
      description: "Combined stored file sizes",
      icon: HardDrive,
    },
    {
      title: "Files stored",
      value: fileStats.total.toLocaleString(),
      description: "Total file count",
      icon: FileText,
    },
    {
      title: "Folders",
      value: folderStats.total.toLocaleString(),
      description: "Total folder count",
      icon: Folder,
    },
    {
      title: "Hack Club links",
      value: hackClubStats.total.toLocaleString(),
      description: "Linked provider accounts",
      icon: ShieldCheck,
    },
    {
      title: "Custom quotas",
      value: quotaStats.total.toLocaleString(),
      description: "Accounts with assigned quotas",
      icon: Settings,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-10">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">OVERVIEW</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Your service at a glance.
          </p>
        </div>

        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">
          Live database statistics
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="min-w-0 rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Recent signups</h2>
              <p className="mt-1 text-sm text-white/45">
                The latest accounts created
              </p>
            </div>
            <Link
              href="/admin?section=users"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              All users <ArrowRight size={15} />
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <p className="mt-8 text-sm text-white/45">
              No accounts have been registered yet.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-white/10">
              {recentUsers.map((recentUser) => (
                <div
                  key={recentUser.id}
                  className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-semibold">
                    {(recentUser.name || recentUser.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {recentUser.name || "Unnamed user"}
                    </p>
                    <p className="truncate text-xs text-white/45">
                      {recentUser.email}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-xs text-white/45">
                    {formatDate(recentUser.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="font-semibold">Quick access</h2>
          <p className="mt-1 text-sm text-white/45">
            Common administration tasks
          </p>

          <div className="mt-5 grid gap-3">
            <QuickLink
              title="User management"
              description="Find and review accounts"
              href="/admin?section=users"
              icon={Users}
            />
            <QuickLink
              title="Storage & quotas"
              description="Review storage allocations"
              href="/admin?section=quotas"
              icon={HardDrive}
            />
            <QuickLink
              title="Audit log"
              description="Review administrative actions"
              href="/admin?section=audit"
              icon={FileText}
            />
            <QuickLink
              title="System health"
              description="View service diagnostics"
              href="/admin?section=health"
              icon={Activity}
            />
          </div>
        </section>
      </div>
    </main>
  );
}