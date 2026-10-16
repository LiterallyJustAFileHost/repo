
import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq, sum } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle2,
  CircleX,
  FileText,
  Folder,
  HardDrive,
  Link2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { db } from "@/db";
import { customQuotas, files, folders } from "@/db/schema";
import { account, user } from "@/auth-schema";
import { requireAdmin } from "@/lib/admin";
import UserActions from "./user-actions";

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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/10 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-white/50">{label}</span>
      <span className="break-all text-sm font-medium sm:max-w-[65%] sm:text-right">
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5">
      <Icon size={20} className="text-white/45" />
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </section>
  );
}

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const [
    userRows,
    fileStats,
    folderStats,
    quotaRows,
    linkedAccounts,
  ] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        suspended: user.suspended,
        suspensionReason: user.suspensionReason,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1),
    db
      .select({
        total: count(),
        bytes: sum(files.size),
      })
      .from(files)
      .where(eq(files.userId, id)),
    db
      .select({ total: count() })
      .from(folders)
      .where(eq(folders.userId, id)),
    db
      .select({ quotaBytes: customQuotas.quotaBytes })
      .from(customQuotas)
      .where(eq(customQuotas.userId, id))
      .limit(1),
    db
      .select({
        providerId: account.providerId,
        accountId: account.accountId,
        createdAt: account.createdAt,
      })
      .from(account)
      .where(eq(account.userId, id)),
  ]);

  const targetUser = userRows[0];

  if (!targetUser) notFound();

  const usedBytes = Number(fileStats[0]?.bytes ?? 0);
  const customQuotaBytes = quotaRows[0]?.quotaBytes ?? null;

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-10">
      <Link
        href="/admin?section=users"
        className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to users
      </Link>

      <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {targetUser.image ? (
            <img
              src={targetUser.image}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <UserRound size={28} className="text-white/55" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-accent">USER DETAILS</p>
          <h1 className="mt-1 break-words text-3xl font-semibold tracking-tight">
            {targetUser.name || "Unnamed user"}
          </h1>
          <p className="mt-2 break-all text-sm text-white/50">
            {targetUser.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {targetUser.suspended && (
            <span className="inline-flex items-center rounded-full border border-red-400/25 bg-red-400/5 px-3 py-2 text-xs text-red-400">
              Suspended
            </span>
          )}

          {targetUser.emailVerified ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-400">
              <CheckCircle2 size={15} />
              Email verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white/55">
              <CircleX size={15} />
              Email unverified
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Storage used"
          value={formatBytes(usedBytes)}
          icon={HardDrive}
        />
        <MetricCard
          label="Files"
          value={String(fileStats[0]?.total ?? 0)}
          icon={FileText}
        />
        <MetricCard
          label="Folders"
          value={String(folderStats[0]?.total ?? 0)}
          icon={Folder}
        />
        <MetricCard
          label="Linked providers"
          value={String(linkedAccounts.length)}
          icon={Link2}
        />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
              <UserRound size={19} />
            </div>
            <div>
              <h2 className="font-semibold">Account information</h2>
              <p className="mt-1 text-xs text-white/45">
                Account identity and timestamps
              </p>
            </div>
          </div>

          <div className="mt-5">
            <DetailRow label="Name" value={targetUser.name || "Not set"} />
            <DetailRow label="Email" value={targetUser.email} />
            <DetailRow label="User ID" value={targetUser.id} />
            <DetailRow
              label="Registered"
              value={formatDate(targetUser.createdAt)}
            />
            <DetailRow
              label="Last profile update"
              value={formatDate(targetUser.updatedAt)}
            />
            <DetailRow
              label="Account status"
              value={targetUser.suspended ? "Suspended" : "Active"}
            />
            {targetUser.suspensionReason && (
              <DetailRow
                label="Suspension reason"
                value={targetUser.suspensionReason}
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2 className="font-semibold">Storage allocation</h2>
              <p className="mt-1 text-xs text-white/45">
                Current usage and assigned quota
              </p>
            </div>
          </div>

          <div className="mt-5">
            <DetailRow
              label="Storage used"
              value={formatBytes(usedBytes)}
            />
            <DetailRow
              label="Custom quota"
              value={
                customQuotaBytes === null
                  ? "No custom quota"
                  : formatBytes(customQuotaBytes)
              }
            />
            <DetailRow
              label="File count"
              value={String(fileStats[0]?.total ?? 0)}
            />
            <DetailRow
              label="Folder count"
              value={String(folderStats[0]?.total ?? 0)}
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-white/40">
            The custom quota is the saved override, if one exists. Default
            quota resolution and enforcement are managed separately.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-6 xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
              <Link2 size={19} />
            </div>
            <div>
              <h2 className="font-semibold">Linked accounts</h2>
              <p className="mt-1 text-xs text-white/45">
                Authentication providers connected to this user
              </p>
            </div>
          </div>

          {linkedAccounts.length === 0 ? (
            <p className="mt-5 text-sm text-white/45">
              No linked providers found.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {linkedAccounts.map((linkedAccount, index) => (
                <div
                  key={`${linkedAccount.providerId}-${linkedAccount.accountId}-${index}`}
                  className="rounded-xl border border-white/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{linkedAccount.providerId}</p>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/45">
                      Linked
                    </span>
                  </div>
                  <p className="mt-3 break-all text-xs text-white/50">
                    Account ID: {linkedAccount.accountId}
                  </p>
                  <p className="mt-2 text-xs text-white/40">
                    Connected {formatDate(linkedAccount.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <UserActions
        userId={targetUser.id}
        name={targetUser.name}
        email={targetUser.email}
        image={targetUser.image}
        suspended={targetUser.suspended}
        suspensionReason={targetUser.suspensionReason}
        isSelf={admin.user.id === targetUser.id}
      />
    </main>
  );
}
