ALTER TABLE "commissions" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "completion_date" timestamp;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "reference_images" text DEFAULT '[]';