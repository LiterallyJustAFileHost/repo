import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { files } from "@/db/schema";
import { getActiveUserAccess } from "@/lib/user-access";
import { drive } from "@/lib/google-drive";

export const runtime = "nodejs";

const ALLOWED_VISIBILITIES = new Set([
  "Inaccessible",
  "Accessible",
]);

const MAX_FILE_NAME_LENGTH = 255;

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedFile(id: string, userId: string) {
  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, id), eq(files.userId, userId)))
    .limit(1);

  return file;
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const { id } = await params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 },
      );
    }

    const input = body as {
      name?: unknown;
      visibility?: unknown;
    };

    const hasName = Object.prototype.hasOwnProperty.call(input, "name");
    const hasVisibility = Object.prototype.hasOwnProperty.call(
      input,
      "visibility",
    );

    if (!hasName && !hasVisibility) {
      return NextResponse.json(
        { error: "Provide a name or visibility to update" },
        { status: 400 },
      );
    }

    let name: string | undefined;

    if (hasName) {
      if (typeof input.name !== "string") {
        return NextResponse.json(
          { error: "File name must be a string" },
          { status: 400 },
        );
      }

      name = input.name.trim();

      if (!name) {
        return NextResponse.json(
          { error: "File name cannot be empty" },
          { status: 400 },
        );
      }

      if (name.length > MAX_FILE_NAME_LENGTH) {
        return NextResponse.json(
          {
            error: `File name must be ${MAX_FILE_NAME_LENGTH} characters or fewer`,
          },
          { status: 400 },
        );
      }

      if (/[\u0000-\u001f\u007f]/.test(name)) {
        return NextResponse.json(
          { error: "File name contains unsupported control characters" },
          { status: 400 },
        );
      }
    }

    let visibility: "Inaccessible" | "Accessible" | undefined;

    if (hasVisibility) {
      if (
        typeof input.visibility !== "string" ||
        !ALLOWED_VISIBILITIES.has(input.visibility)
      ) {
        return NextResponse.json(
          {
            error:
              'Visibility must be "Inaccessible" or "Accessible"',
          },
          { status: 400 },
        );
      }

      visibility = input.visibility as "Inaccessible" | "Accessible";
    }

    const file = await getOwnedFile(id, userId);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      );
    }

    if (name !== undefined && name !== file.name) {
      await drive.files.update({
        fileId: file.storageKey,
        requestBody: { name },
      });
    }

    const updates: Partial<typeof files.$inferInsert> = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (visibility !== undefined) {
      updates.visibility = visibility;
    }

    const [updatedFile] = await db
      .update(files)
      .set(updates)
      .where(and(eq(files.id, id), eq(files.userId, userId)))
      .returning();

    if (!updatedFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ file: updatedFile });
  } catch (error) {
    console.error("Failed to update file:", error);

    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const access = await getActiveUserAccess();

    if (!access.session) {
      return access.response;
    }

    const userId = access.session.user.id;
    const { id } = await params;
    const file = await getOwnedFile(id, userId);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      );
    }

    await drive.files.delete({
      fileId: file.storageKey,
    });

    await db
      .delete(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete file:", error);

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}