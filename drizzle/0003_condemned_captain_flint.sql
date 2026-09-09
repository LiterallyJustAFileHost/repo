ALTER TABLE "folder" ADD COLUMN "storage_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_storage_key_unique" UNIQUE("storage_key");