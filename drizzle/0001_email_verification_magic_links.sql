-- Email verification and passwordless magic-link sign-in

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "token_hash" varchar(128) NOT NULL,
  "purpose" varchar(30) DEFAULT 'magic_link' NOT NULL,
  "redirect_path" varchar(500) DEFAULT '/dashboard',
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "verification_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "verification_tokens_email_idx" ON "verification_tokens" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tokens_token_hash_idx" ON "verification_tokens" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tokens_expires_at_idx" ON "verification_tokens" USING btree ("expires_at");
