import {
  pgTable,
  text,
  timestamp,
  bigint,
  index,
} from "drizzle-orm/pg-core";

import { user } from "../auth-schema";

export const files = pgTable(
  "file",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    storageKey: text("storage_key").notNull().unique(),

    mimeType: text("mime_type").notNull(),

    size: bigint("size", {
      mode: "number",
    }).notNull(),

    shareId: text("share_id").notNull().unique(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("file_user_id_idx").on(table.userId),
    index("file_share_id_idx").on(table.shareId),
  ],
);