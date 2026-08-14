CREATE TYPE "public"."analysis_status" AS ENUM('queued', 'uploading', 'processing', 'validating_media', 'extracting_metadata', 'ready_for_detection', 'analyzing', 'finalizing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."classification_level" AS ENUM('level_0', 'level_1', 'level_2', 'level_3', 'level_4', 'level_5');--> statement-breakpoint
CREATE TYPE "public"."metadata_status" AS ENUM('pending', 'extracting', 'completed', 'failed', 'unsupported');--> statement-breakpoint
CREATE TYPE "public"."provenance_status" AS ENUM('verified', 'not_verified', 'unavailable', 'detected_unverified');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."storage_status" AS ENUM('pending', 'uploading', 'uploaded', 'verified', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('likely_authentic', 'possibly_manipulated', 'likely_ai_generated', 'unverified', 'insufficient_evidence');--> statement-breakpoint
CREATE TABLE "analysis_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_id" varchar(100),
	"status" "analysis_status" DEFAULT 'queued' NOT NULL,
	"job_type" varchar(50) DEFAULT 'full_analysis' NOT NULL,
	"provider_status" text,
	"error_code" varchar(100),
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_job_id" uuid NOT NULL,
	"verdict" "verdict" NOT NULL,
	"ai_involvement_score" real NOT NULL,
	"manipulation_score" real NOT NULL,
	"confidence_score" real NOT NULL,
	"classification_level" "classification_level" NOT NULL,
	"provenance_status" "provenance_status" NOT NULL,
	"summary" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_results_analysis_job_id_unique" UNIQUE("analysis_job_id")
);
--> statement-breakpoint
CREATE TABLE "analysis_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_result_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"signal_type" varchar(100) NOT NULL,
	"score" real,
	"severity" "severity" NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"timestamp_start" real,
	"timestamp_end" real,
	"source" varchar(100) DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_id" varchar(100),
	"original_filename" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"storage_provider" varchar(50) DEFAULT 'local' NOT NULL,
	"storage_status" "storage_status" DEFAULT 'pending' NOT NULL,
	"metadata_status" "metadata_status" DEFAULT 'pending' NOT NULL,
	"metadata_error" text,
	"duration" real,
	"width" integer,
	"height" integer,
	"format" varchar(50),
	"video_codec" varchar(50),
	"audio_codec" varchar(50),
	"frame_rate" real,
	"detected_mime_type" varchar(100),
	"is_valid_file" boolean,
	"validation_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"plan_id" varchar(20),
	"pack_id" varchar(50),
	"credits" integer,
	"amount_usd" real,
	"currency" varchar(10) DEFAULT 'USD',
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_result_id" uuid NOT NULL,
	"public_id" varchar(100) NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "reports_analysis_result_id_unique" UNIQUE("analysis_result_id"),
	CONSTRAINT "reports_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_id" varchar(100),
	"event_type" varchar(100) NOT NULL,
	"analysis_job_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"password_hash" text,
	"auth_provider" varchar(50) DEFAULT 'email',
	"role" varchar(20) DEFAULT 'user',
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"billing_cycle" varchar(20),
	"plan_started_at" timestamp,
	"plan_renews_at" timestamp,
	"credits_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_analysis_job_id_analysis_jobs_id_fk" FOREIGN KEY ("analysis_job_id") REFERENCES "public"."analysis_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_signals" ADD CONSTRAINT "analysis_signals_analysis_result_id_analysis_results_id_fk" FOREIGN KEY ("analysis_result_id") REFERENCES "public"."analysis_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_analysis_result_id_analysis_results_id_fk" FOREIGN KEY ("analysis_result_id") REFERENCES "public"."analysis_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_analysis_job_id_analysis_jobs_id_fk" FOREIGN KEY ("analysis_job_id") REFERENCES "public"."analysis_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_jobs_user_id_idx" ON "analysis_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analysis_jobs_guest_id_idx" ON "analysis_jobs" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "analysis_jobs_asset_id_idx" ON "analysis_jobs" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "analysis_jobs_status_idx" ON "analysis_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "analysis_results_job_id_idx" ON "analysis_results" USING btree ("analysis_job_id");--> statement-breakpoint
CREATE INDEX "analysis_signals_result_id_idx" ON "analysis_signals" USING btree ("analysis_result_id");--> statement-breakpoint
CREATE INDEX "assets_user_id_idx" ON "assets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assets_guest_id_idx" ON "assets" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "assets_storage_status_idx" ON "assets" USING btree ("storage_status");--> statement-breakpoint
CREATE INDEX "billing_events_user_id_idx" ON "billing_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "billing_events_type_idx" ON "billing_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "reports_public_id_idx" ON "reports" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "reports_result_id_idx" ON "reports" USING btree ("analysis_result_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "usage_events_user_id_idx" ON "usage_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usage_events_guest_id_idx" ON "usage_events" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "usage_events_type_idx" ON "usage_events" USING btree ("event_type");