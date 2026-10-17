
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const defaults = {
  defaultVisibility: "Inaccessible",
  preferredLink: "share",
  sortKey: "createdAt",
  sortDirection: "desc",
};

const allowedValues = {
  defaultVisibility: ["Inaccessible", "Accessible"],
  preferredLink: ["share", "cdn"],
  sortKey: ["type", "name", "createdAt", "size"],
  sortDirection: ["asc", "desc"],
} as const;

type SettingKey = keyof typeof allowedValues;

function isSettingKey(key: string): key is SettingKey {
  return Object.hasOwn(allowedValues, key);
}

function isValidValue(key: SettingKey, value: unknown) {
  return (allowedValues[key] as readonly unknown[]).includes(value);
}

export async function GET() {
  const access = await getActiveUserAccess();

  if (!access.session) return access.response;

  try {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, access.session.user.id))
      .limit(1);

    return NextResponse.json(settings ?? defaults);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const access = await getActiveUserAccess();

  if (!access.session) return access.response;

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json(
      { error: "Invalid settings" },
      { status: 400 },
    );
  }

  const updates = input as Record<string, unknown>;
  const keys = Object.keys(updates);

  if (
    keys.length === 0 ||
    keys.some((key) => !isSettingKey(key))
  ) {
    return NextResponse.json(
      { error: "Invalid settings fields" },
      { status: 400 },
    );
  }

  for (const key of keys as SettingKey[]) {
    if (!isValidValue(key, updates[key])) {
      return NextResponse.json(
        { error: `Invalid value for ${key}` },
        { status: 400 },
      );
    }
  }

  try {
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, access.session.user.id))
      .limit(1);

    const values = {
      ...defaults,
      ...existing,
      ...updates,
      userId: access.session.user.id,
      updatedAt: new Date(),
    };

    const [settings] = await db
      .insert(userSettings)
      .values(values)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          defaultVisibility: values.defaultVisibility,
          preferredLink: values.preferredLink,
          sortKey: values.sortKey,
          sortDirection: values.sortDirection,
          updatedAt: values.updatedAt,
        },
      })
      .returning();

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
