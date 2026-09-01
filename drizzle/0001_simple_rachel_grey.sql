CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"share_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "file_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "file_user_id_idx" ON "file" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "file_share_id_idx" ON "file" USING btree ("share_id");