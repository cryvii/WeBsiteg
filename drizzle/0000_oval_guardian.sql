CREATE TYPE "public"."status" AS ENUM('pending', 'approved', 'rejected', 'paid', 'completed');--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"email" text NOT NULL,
	"description" text NOT NULL,
	"price" integer,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"is_commissions_open" boolean DEFAULT true NOT NULL,
	"queue_limit" integer DEFAULT 200 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
