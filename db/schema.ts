
import {
  pgTable,
  text,
  timestamp,
  bigint,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { user } from "../auth-schema";

export const folders = pgTable(
  "folder",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parentId: text("parent_id").references(
      (): AnyPgColumn => folders.id,
      { onDelete: "cascade" },
    ),
    storageKey: text("storage_key").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("folder_user_id_idx").on(table.userId),
    index("folder_parent_id_idx").on(table.parentId),
  ],
);

export const files = pgTable(
  "file",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folders.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    shareId: text("share_id").notNull().unique(),
    visibility: text("visibility").notNull().default("Inaccessible"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("file_user_id_idx").on(table.userId),
    index("file_folder_id_idx").on(table.folderId),
    index("file_share_id_idx").on(table.shareId),
  ],
);

export const customQuotas = pgTable(
  "custom_quota",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    quotaBytes: bigint("quota_bytes", { mode: "number" }).notNull(),
    updatedBy: text("updated_by").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("custom_quota_updated_by_idx").on(table.updatedBy)],
);

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").notNull(),
    action: text("action").notNull(),
    targetUserId: text("target_user_id"),
    previousValue: text("previous_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_created_at_idx").on(table.createdAt),
    index("admin_audit_actor_idx").on(table.actorUserId),
    index("admin_audit_target_idx").on(table.targetUserId),
  ],
);

export const adminRoles = pgTable(
  "admin_role",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    grantedBy: text("granted_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("admin_role_granted_by_idx").on(table.grantedBy)],
);

export const privacyRequests = pgTable(
  "privacy_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").default("pending").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("privacy_request_user_idx").on(table.userId),
    index("privacy_request_status_idx").on(table.status),
    index("privacy_request_created_at_idx").on(table.createdAt),
  ],
);

export const uploadReservations = pgTable(
  "upload_reservation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("upload_reservation_user_idx").on(table.userId),
    index("upload_reservation_expires_idx").on(table.expiresAt),
  ],
);
