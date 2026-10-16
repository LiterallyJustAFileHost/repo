"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  suspended: boolean;
  suspensionReason: string | null;
  isSelf: boolean;
};

type ApiResponse = {
  error?: string;
  success?: boolean;
  suspended?: boolean;
  suspensionReason?: string | null;
  user?: {
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
  };
};

export default function UserActions({
  userId,
  name,
  email,
  image,
  suspended: initialSuspended,
  suspensionReason: initialSuspensionReason,
  isSelf,
}: Props) {
  const router = useRouter();
  const [profileName, setProfileName] = useState(name);
  const [profileEmail, setProfileEmail] = useState(email);
  const [profileImage, setProfileImage] = useState(image ?? "");
  const [suspended, setSuspended] = useState(initialSuspended);
  const [reason, setReason] = useState(initialSuspensionReason ?? "");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setProfileName(name);
    setProfileEmail(email);
    setProfileImage(image ?? "");
    setSuspended(initialSuspended);
    setReason(initialSuspensionReason ?? "");
  }, [name, email, image, initialSuspended, initialSuspensionReason]);

  async function send(
    method: "PATCH" | "DELETE",
    body: Record<string, unknown>,
  ) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed.");
      }

      if (method === "DELETE") {
        router.replace("/admin?section=users");
        router.refresh();
        return;
      }

      if (data.user) {
        setProfileName(data.user.name);
        setProfileEmail(data.user.email);
        setProfileImage(data.user.image ?? "");
      }

      if (typeof data.suspended === "boolean") {
        setSuspended(data.suspended);
        setReason(data.suspensionReason ?? "");
      }

      if (body.action === "suspend") {
        setSuspended(true);
        setReason(String(body.reason ?? ""));
      } else if (body.action === "reactivate") {
        setSuspended(false);
        setReason("");
      }

      setMessage("Changes saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      setMessage("Enter the user's exact email address to confirm.");
      return;
    }

    if (
      !window.confirm(
        `Permanently delete ${email} and their stored files? This cannot be undone.`,
      )
    ) {
      return;
    }

    await send("DELETE", { confirmEmail: confirmEmail.trim() });
  }

  const emailMatches =
    confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();

  return (
    <section className="mt-8 grid gap-5 xl:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send("PATCH", {
              name: profileName,
              email: profileEmail,
              image: profileImage.trim() || null,
            });
          }}
        >
          <label className="block text-sm">
            Name
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-2"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-2"
              type="email"
              value={profileEmail}
              onChange={(event) => setProfileEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Profile image URL
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-2"
              type="url"
              value={profileImage}
              onChange={(event) => setProfileImage(event.target.value)}
              maxLength={2048}
            />
          </label>
          <button
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            disabled={busy}
            type="submit"
          >
            {busy ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="text-lg font-semibold">Account status</h2>
        <p className="mt-2 text-sm text-white/55">
          Status: {suspended ? "Suspended" : "Active"}
        </p>
        {suspended && reason && (
          <p className="mt-2 break-words text-sm text-white/45">
            Reason: {reason}
          </p>
        )}
        {isSelf ? (
          <p className="mt-4 text-sm text-white/45">
            You cannot suspend or delete your own account here.
          </p>
        ) : (
          <>
            {!suspended && (
              <label className="mt-4 block text-sm">
                Suspension reason
                <textarea
                  className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-2"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={1000}
                  rows={3}
                />
              </label>
            )}
            <button
              className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
              disabled={busy || (!suspended && !reason.trim())}
              onClick={() => {
                if (suspended) {
                  void send("PATCH", { action: "reactivate" });
                } else if (
                  window.confirm(
                    `Suspend ${email} and revoke their active sessions?`,
                  )
                ) {
                  void send("PATCH", { action: "suspend", reason });
                }
              }}
            >
              {suspended ? "Reactivate account" : "Suspend account"}
            </button>
          </>
        )}
      </div>

      {!isSelf && (
        <div className="rounded-2xl border border-red-400/20 bg-surface p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-red-400">Delete account</h2>
          <p className="mt-2 text-sm text-white/55">
            This permanently removes the account and attempts to delete its
            stored Google Drive files and folders.
          </p>
          <label className="mt-4 block text-sm">
            Type {email} to confirm
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-2"
              type="text"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy || !emailMatches}
            onClick={() => void deleteAccount()}
          >
            {busy ? "Deleting..." : "Permanently delete account"}
          </button>
        </div>
      )}

      {message && (
        <p aria-live="polite" className="text-sm text-white/70 xl:col-span-2">
          {message}
        </p>
      )}
    </section>
  );
}