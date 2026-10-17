CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"default_visibility" text DEFAULT 'Inaccessible' NOT NULL,
	"preferred_link" text DEFAULT 'share' NOT NULL,
	"sort_key" text DEFAULT 'createdAt' NOT NULL,
	"sort_direction" text DEFAULT 'desc' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;