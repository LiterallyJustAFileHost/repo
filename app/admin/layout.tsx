import Link from "next/link";
import {
  Activity,
  FileClock,
  Gauge,
  HardDrive,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserRoundCog,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin";

const navigation = [
  {
    label: "Dashboard",
    items: [
      { name: "Overview", section: "overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Users", section: "users", icon: Users },
      { name: "Storage & quotas", section: "quotas", icon: HardDrive },
      { name: "Admin roles", section: "roles", icon: UserRoundCog },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Audit log", section: "audit", icon: FileClock },
      { name: "System health", section: "health", icon: Activity },
      { name: "Abuse prevention", section: "abuse", icon: ShieldAlert },
      { name: "Privacy requests", section: "requests", icon: ShieldCheck },
    ],
  },
  {
    label: "Configuration",
    items: [
      { name: "Settings", section: "settings", icon: Settings },
    ],
  },
];

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="min-w-0 border-b border-white/10 bg-surface lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-accent font-bold">
            L
          </div>
          <div>
            <p className="font-semibold">Literally Just A File Host</p>
            <p className="text-xs text-white/50">Admin Panel</p>
          </div>
        </div>

        <nav className="space-y-6 p-4">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.section}
                      href={
                        item.section === "overview"
                          ? "/admin"
                          : `/admin?section=${item.section}`
                      }
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/dashboard"
            className="block rounded-xl px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-6 lg:px-10">
          <p className="text-sm text-white/50">Control panel</p>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
            Admin
          </span>
        </header>

        {children}
      </div>
    </div>
  );
}
