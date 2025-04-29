CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_title" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"industry" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"logo" text,
	"project_name" text NOT NULL,
	"project_description" text,
	"project_status" text DEFAULT 'active' NOT NULL,
	"project_start_date" timestamp DEFAULT '2025-04-29 15:39:40.343' NOT NULL,
	"project_end_date" timestamp,
	"project_value" integer DEFAULT 0 NOT NULL,
	"last_contact" timestamp DEFAULT '2025-04-29 15:39:40.343' NOT NULL,
	"created_at" timestamp DEFAULT '2025-04-29 15:39:40.343' NOT NULL
);
