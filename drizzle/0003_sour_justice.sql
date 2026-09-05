CREATE TABLE "folder" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file" ADD COLUMN "folder_id" text;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_parent_id_folder_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "folder_user_id_idx" ON "folder" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "folder_parent_id_idx" ON "folder" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "file_folder_id_idx" ON "file" USING btree ("folder_id");