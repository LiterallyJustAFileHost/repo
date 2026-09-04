import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import { drive } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const body = await request.json();

    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 },
      );
    }

    const [file] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, id),
          eq(files.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      );
    }

    await drive.files.update({
      fileId: file.storageKey,
      requestBody: {
        name,
      },
    });

    const [updatedFile] = await db
      .update(files)
      .set({
        name,
      })
      .where(
        and(
          eq(files.id, id),
          eq(files.userId, session.user.id),
        ),
      )
      .returning();

    return NextResponse.json({
      file: updatedFile,
    });
  } catch (error) {
    console.error(
      "Failed to rename file:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to rename file" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const [file] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, id),
          eq(files.userId, session.user.id),
        ),
      )
      .limit(1);

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
      .where(
        and(
          eq(files.id, id),
          eq(files.userId, session.user.id),
        ),
      );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete file:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}