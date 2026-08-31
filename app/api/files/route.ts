import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";

export async function GET() {
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

        const userFiles = await db
            .select({
                id: files.id,
                name: files.name,
                storageKey: files.storageKey,
                mimeType: files.mimeType,
                size: files.size,
                shareId: files.shareId,
                createdAt: files.createdAt,
            })
            .from(files)
            .where(eq(files.userId, session.user.id))
            .orderBy(desc(files.createdAt));
        
        return NextResponse.json({
            files: userFiles,
        });
    } catch (error) {
        console.error("Failed to fetch files:", error);

        return NextResponse.json(
            { error: "Failed to fetch files" },
            { status: 500 },
        );
    }
}