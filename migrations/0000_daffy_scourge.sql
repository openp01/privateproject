CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"therapist_id" integer NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"duration" integer,
	"type" text,
	"notes" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" text,
	"recurring_count" integer,
	"parent_appointment_id" integer
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" text NOT NULL,
	"category" text NOT NULL,
	"payment_method" text NOT NULL,
	"notes" text,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"patient_id" integer NOT NULL,
	"therapist_id" integer NOT NULL,
	"appointment_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"tax_rate" numeric DEFAULT '0' NOT NULL,
	"total_amount" numeric NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"issue_date" text NOT NULL,
	"due_date" text NOT NULL,
	"payment_method" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"birth_date" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "therapist_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"therapist_id" integer NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" text NOT NULL,
	"payment_method" text NOT NULL,
	"payment_reference" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"email" text,
	"phone" text,
	"color" text,
	"available_days" text,
	"work_hours" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'secretariat' NOT NULL,
	"therapist_id" integer,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "therapist_payments" ADD CONSTRAINT "therapist_payments_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_payments" ADD CONSTRAINT "therapist_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;