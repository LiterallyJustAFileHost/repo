CREATE TABLE "upload_reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_reservation" ADD CONSTRAINT "upload_reservation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_reservation_user_idx" ON "upload_reservation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "upload_reservation_expires_idx" ON "upload_reservation" USING btree ("expires_at");