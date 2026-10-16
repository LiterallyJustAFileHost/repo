import { randomUUID } from "crypto";
import { and, count, eq, isNull, sum } from "drizzle-orm";
import { NextResponse } from "next/server";

import { account, session as authSession, user } from "@/auth-schema";
import { db } from "@/db";
import {
  adminAuditLog,
  customQuotas,
  files,
  folders,
} from "@/db/schema";
import { getAdminSession } from "@/lib/admin";
import { deleteDriveFolderRecursive } from "@/lib/google-drive-cleanup";
import { drive } from "@/lib/google-drive";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const admin = await getAdminSession();

    if (!admin) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const [userRows, fileStats, folderStats, quotaRows, linkedAccounts] =
      await Promise.all([
        db.select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          suspended: user.suspended,
          suspensionReason: user.suspensionReason,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }).from(user).where(eq(user.id, id)).limit(1),
        db.select({ total: count(), bytes: sum(files.size) })
          .from(files).where(eq(files.userId, id)),
        db.select({ total: count() })
          .from(folders).where(eq(folders.userId, id)),
        db.select({ quotaBytes: customQuotas.quotaBytes })
          .from(customQuotas).where(eq(customQuotas.userId, id)).limit(1),
        db.select({
          providerId: account.providerId,
          accountId: account.accountId,
          createdAt: account.createdAt,
        }).from(account).where(eq(account.userId, id)),
      ]);

    const target = userRows[0];

    if (!target) return errorResponse("User not found.", 404);

    return NextResponse.json({
      user: target,
      storage: {
        fileCount: fileStats[0]?.total ?? 0,
        folderCount: folderStats[0]?.total ?? 0,
        usedBytes: Number(fileStats[0]?.bytes ?? 0),
        customQuotaBytes: quotaRows[0]?.quotaBytes ?? null,
      },
      providers: linkedAccounts.map((item) => ({
        providerId: item.providerId,
        accountId: item.accountId,
        linkedAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin user details failed:", error);
    return errorResponse("Unable to load user details.", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const admin = await getAdminSession();

    if (!admin) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const [target] = await db.select().from(user)
      .where(eq(user.id, id)).limit(1);

    if (!target) return errorResponse("User not found.", 404);

    const body = await request.json();

    if (body.action === "suspend" || body.action === "reactivate") {
      if (id === admin.user.id) {
        return errorResponse("You cannot change your own account status.", 400);
      }

      const suspended = body.action === "suspend";
      const reason = suspended && typeof body.reason === "string"
        ? body.reason.trim().slice(0, 1000)
        : "";

      if (suspended && !reason) {
        return errorResponse("A suspension reason is required.", 400);
      }

      await db.transaction(async (tx) => {
        if (suspended) {
          await tx.delete(authSession).where(eq(authSession.userId, id));
        }

        await tx.update(user).set({
          suspended,
          suspensionReason: suspended ? reason : null,
        }).where(eq(user.id, id));

        await tx.insert(adminAuditLog).values({
          id: randomUUID(),
          actorUserId: admin.user.id,
          action: suspended ? "user.suspend" : "user.reactivate",
          targetUserId: id,
          previousValue: JSON.stringify({
            suspended: target.suspended,
            suspensionReason: target.suspensionReason,
          }),
          newValue: JSON.stringify({
            suspended,
            suspensionReason: suspended ? reason : null,
          }),
        });
      });

      return NextResponse.json({
        success: true,
        suspended,
        suspensionReason: suspended ? reason : null,
      });
    }

    const name = typeof body.name === "string" ? body.name.trim() : target.name;
    const email = typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : target.email;
    const image = typeof body.image === "string" || body.image === null
      ? body.image
      : target.image;

    if (!name || name.length > 100) {
      return errorResponse("Name must be between 1 and 100 characters.", 400);
    }

    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse("Enter a valid email address.", 400);
    }

    if (image !== null && image !== undefined && image.length > 2048) {
      return errorResponse("Profile image URL is too long.", 400);
    }

    const emailChanged = email !== target.email;

    if (emailChanged) {
      const [existing] = await db.select({ id: user.id }).from(user)
        .where(eq(user.email, email)).limit(1);

      if (existing && existing.id !== id) {
        return errorResponse("That email address is already in use.", 409);
      }
    }

    const nextImage = image === undefined ? target.image : image;

    await db.transaction(async (tx) => {
      await tx.update(user).set({
        name,
        email,
        image: nextImage,
        ...(emailChanged ? { emailVerified: false } : {}),
      }).where(eq(user.id, id));

      await tx.insert(adminAuditLog).values({
        id: randomUUID(),
        actorUserId: admin.user.id,
        action: "user.profile.update",
        targetUserId: id,
        previousValue: JSON.stringify({
          name: target.name,
          email: target.email,
          image: target.image,
          emailVerified: target.emailVerified,
        }),
        newValue: JSON.stringify({
          name,
          email,
          image: nextImage,
          emailVerified: emailChanged ? false : target.emailVerified,
        }),
      });
    });

    return NextResponse.json({
      success: true,
      user: {
        id,
        name,
        email,
        image: nextImage,
        emailVerified: emailChanged ? false : target.emailVerified,
      },
    });
  } catch (error) {
    console.error("Admin user update failed:", error);
    return errorResponse("Unable to update user.", 500);
  }
}


export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const admin = await getAdminSession();

    if (!admin) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    if (id === admin.user.id) {
      return errorResponse("You cannot delete your own account.", 400);
    }

    const [target] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!target) return errorResponse("User not found.", 404);

    const body = await request.json().catch(() => null);

    const confirmEmail =
      typeof body?.confirmEmail === "string"
        ? body.confirmEmail.trim().toLowerCase()
        : "";

    if (confirmEmail !== target.email.trim().toLowerCase()) {
      return errorResponse("Confirmation email does not match.", 400);
    }

    const [userFiles, topFolders] = await Promise.all([
      db
        .select({
          storageKey: files.storageKey,
          folderId: files.folderId,
        })
        .from(files)
        .where(eq(files.userId, id)),
      db
        .select({
          id: folders.id,
          storageKey: folders.storageKey,
        })
        .from(folders)
        .where(and(eq(folders.userId, id), isNull(folders.parentId))),
    ]);

    const standaloneFiles = userFiles.filter((file) => file.folderId === null);

    try {
      for (const folder of topFolders) {
        await deleteDriveFolderRecursive(folder.storageKey);
      }

      for (const file of standaloneFiles) {
        await drive.files.delete({ fileId: file.storageKey });
      }
    } catch (error) {
      const status =
        (error as { code?: number; response?: { status?: number } }).code ??
        (error as { response?: { status?: number } }).response?.status;

      if (status !== 404) {
        console.error("Drive cleanup failed during account deletion:", error);
        return errorResponse(
          "Drive cleanup failed. The account has been kept. Some Drive items may already have been deleted.",
          502,
        );
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(adminAuditLog).values({
        id: randomUUID(),
        actorUserId: admin.user.id,
        action: "user.delete",
        targetUserId: id,
        previousValue: JSON.stringify({
          ...target,
          fileCount: userFiles.length,
          folderCount: topFolders.length,
        }),
        newValue: null,
      });

      await tx.delete(user).where(eq(user.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user deletion failed:", error);
    return errorResponse("Unable to delete user.", 500);
  }
}
