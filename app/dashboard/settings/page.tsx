
import {
  ArrowDownAZ,
  ArrowLeft,
  Check,
  HardDrive,
  Link2,
  LogOut,
  LockKeyhole,
  Settings2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireActiveUser } from "@/lib/user-access";
import { StorageQuotaCard } from "../storage-quota-card";
import { SettingsSignOut } from "./settings-sign-out";
import { SettingsPreferences } from "./settings-preferences";

export default async function SettingsPage() {
  await requireActiveUser();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth");

  const [storedSettings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1);

  const preferences = storedSettings ?? {
    defaultVisibility: "Inaccessible",
    preferredLink: "share",
    sortKey: "createdAt",
    sortDirection: "desc",
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center gap-4 border-b border-(--surface-2) bg-surface px-6 py-4 sm:px-8">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 text-(--foreground-muted) transition hover:bg-(--surface-2) hover:text-foreground"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Settings</h1>
          <p className="text-sm text-(--foreground-muted)">
            Manage your account and preferences
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 sm:px-8">
        <section className="flex flex-col gap-5 rounded-xl border border-(--surface-2) p-5">
          <div className="flex items-center gap-3">
            <UserRound size={20} className="text-(--foreground-muted)" />
            <div>
              <h2 className="font-semibold">Account</h2>
              <p className="text-sm text-(--foreground-muted)">
                Your account information
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-(--surface-2) p-3">
              <p className="text-sm text-(--foreground-muted)">Name</p>
              <p className="mt-1 break-words font-medium">
                {session.user.name || "Not set"}
              </p>
            </div>
            <div className="rounded-lg bg-(--surface-2) p-3">
              <p className="text-sm text-(--foreground-muted)">Email</p>
              <p className="mt-1 break-words font-medium">
                {session.user.email}
              </p>
            </div>
            <div className="rounded-lg bg-(--surface-2) p-3">
              <p className="text-sm text-(--foreground-muted)">
                Email verification
              </p>
              <p className="mt-1 font-medium">
                {session.user.emailVerified ? "Verified" : "Not verified"}
              </p>
            </div>
            <div className="rounded-lg bg-(--surface-2) p-3">
              <p className="text-sm text-(--foreground-muted)">User ID</p>
              <p className="mt-1 break-all font-mono text-xs">
                {session.user.id}
              </p>
            </div>
          </div>
        </section>

        <SettingsPreferences />

        <section className="flex flex-col gap-4 rounded-xl border border-(--surface-2) p-5">
          <div className="flex items-center gap-3">
            <HardDrive size={20} className="text-(--foreground-muted)" />
            <div>
              <h2 className="font-semibold">Storage</h2>
              <p className="text-sm text-(--foreground-muted)">
                Your current storage usage and quota
              </p>
            </div>
          </div>
          <StorageQuotaCard />
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-(--surface-2) p-5">
          <div className="flex items-center gap-3">
            <Settings2 size={20} className="text-(--foreground-muted)" />
            <div>
              <h2 className="font-semibold">Current preferences</h2>
              <p className="text-sm text-(--foreground-muted)">
                A summary of your saved defaults
              </p>
            </div>
          </div>

          <div className="divide-y divide-(--surface-2)">
            <div className="flex items-center gap-3 py-3">
              <LockKeyhole size={17} className="text-(--foreground-muted)" />
              <span className="flex-1 text-sm">New file visibility</span>
              <span className="text-sm font-medium">
                {preferences.defaultVisibility}
              </span>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Link2 size={17} className="text-(--foreground-muted)" />
              <span className="flex-1 text-sm">Preferred link</span>
              <span className="text-sm font-medium">
                {preferences.preferredLink === "cdn" ? "CDN link" : "Share page"}
              </span>
            </div>
            <div className="flex items-center gap-3 py-3">
              <ArrowDownAZ size={17} className="text-(--foreground-muted)" />
              <span className="flex-1 text-sm">Sort order</span>
              <span className="text-sm font-medium">
                {{
                  name: "Name",
                  type: "Type",
                  createdAt: "Upload date",
                  size: "Size",
                }[preferences.sortKey] ?? "Upload date"}
                {" · "}
                {preferences.sortDirection === "asc" ? "Ascending" : "Descending"}
              </span>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-(--foreground-muted)">
            <Check size={14} />
            Preferences are saved to your account
          </p>
        </section>

        <section className="flex items-center justify-between gap-4 rounded-xl border border-(--surface-2) p-5">
          <div className="flex items-center gap-3">
            <LogOut size={20} className="text-(--foreground-muted)" />
            <div>
              <h2 className="font-semibold">Sign out</h2>
              <p className="text-sm text-(--foreground-muted)">
                Sign out of your current session
              </p>
            </div>
          </div>
          <SettingsSignOut />
        </section>
      </main>
    </div>
  );
}
