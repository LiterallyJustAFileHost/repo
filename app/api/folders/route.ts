import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { folders } from "@/db/schema";

export async function POST(
  request: Request,
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

    const body = await request.json();

    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    const [folder] = await db
      .insert(folders)
      .values({
        id: randomUUID(),
        userId: session.user.id,
        name,
        parentId: null,
      })
      .returning();

    return NextResponse.json(
      {
        folder,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Failed to create folder:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to create folder",
      },
      {
        status: 500,
      },
    );
  }
}