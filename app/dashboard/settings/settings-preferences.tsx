"use client";

import { useEffect, useState } from "react";

type Settings = {
  defaultVisibility: "Inaccessible" | "Accessible";
  preferredLink: "share" | "cdn";
  sortKey: "type" | "name" | "createdAt" | "size";
  sortDirection: "asc" | "desc";
};

const defaults: Settings = {
  defaultVisibility: "Inaccessible",
  preferredLink: "share",
  sortKey: "createdAt",
  sortDirection: "desc",
};

const fields = [
  {
    key: "defaultVisibility",
    label: "Default visibility for new files",
    description: "Controls whether newly uploaded files are accessible by link.",
    options: [
      { value: "Inaccessible", label: "Inaccessible" },
      { value: "Accessible", label: "Accessible" },
    ],
  },
  {
    key: "preferredLink",
    label: "Preferred copied link",
    description: "Choose which link format the dashboard copies.",
    options: [
      { value: "share", label: "Share page" },
      { value: "cdn", label: "CDN link" },
    ],
  },
  {
    key: "sortKey",
    label: "Default file sorting",
    description: "Choose the column used to sort your files.",
    options: [
      { value: "createdAt", label: "Upload date" },
      { value: "name", label: "Name" },
      { value: "type", label: "Type" },
      { value: "size", label: "Size" },
    ],
  },
  {
    key: "sortDirection",
    label: "Default sort direction",
    description: "Choose the initial ordering of the file list.",
    options: [
      { value: "desc", label: "Descending" },
      { value: "asc", label: "Ascending" },
    ],
  },
] as const;

export function SettingsPreferences() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load preferences.");
        }

        const data = await response.json();

        if (!cancelled) {
          setSettings({
            defaultVisibility: data.defaultVisibility,
            preferredLink: data.preferredLink,
            sortKey: data.sortKey,
            sortDirection: data.sortDirection,
          });
        }
      } catch {
        if (!cancelled) {
          setError("Could not load preferences. Refresh to try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) {
    const previous = settings[key];

    setSettings((current) => ({ ...current, [key]: value }));
    setSaving(key);
    setError("");
    setSaved("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        throw new Error("Could not save preference.");
      }

      setSaved(key);
    } catch {
      setSettings((current) => ({ ...current, [key]: previous }));
      setError("Could not save that preference. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-(--surface-2) p-5">
      <div>
        <h2 className="font-semibold">Preferences</h2>
        <p className="text-sm text-(--foreground-muted)">
          Customize how your files are shared and displayed.
        </p>
      </div>

      {fields.map((field) => (
        <div
          key={field.key}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <label
              htmlFor={`setting-${field.key}`}
              className="text-sm font-medium"
            >
              {field.label}
            </label>
            <p className="mt-1 text-sm text-(--foreground-muted)">
              {field.description}
            </p>
          </div>

          <select
            id={`setting-${field.key}`}
            value={settings[field.key]}
            disabled={loading || saving !== null}
            onChange={(event) => {
              const value = event.target.value;
              void updateSetting(
                field.key,
                value as Settings[typeof field.key],
              );
            }}
            className="rounded-lg border border-(--surface-2) bg-surface px-3 py-2 text-sm disabled:opacity-50 sm:min-w-40"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      {!error && saved && !saving && (
        <p role="status" className="text-sm text-(--foreground-muted)">
          Preference saved.
        </p>
      )}

      {loading && (
        <p className="text-sm text-(--foreground-muted)">
          Loading preferences...
        </p>
      )}
    </section>
  );
}
