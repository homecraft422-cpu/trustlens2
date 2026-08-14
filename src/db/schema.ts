import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  varchar,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const analysisStatusEnum = pgEnum("analysis_status", [
  "queued",
  "uploading",
  "processing",
  "validating_media",
  "extracting_metadata",
  "ready_for_detection",
  "analyzing",
  "finalizing",
  "completed",
  "failed",
]);

export const storageStatusEnum = pgEnum("storage_status", [
  "pending",
  "uploading",
  "uploaded",
  "verified",
  "failed",
  "deleted",
]);

export const metadataStatusEnum = pgEnum("metadata_status", [
  "pending",
  "extracting",
  "completed",
  "failed",
  "unsupported",
]);

export const verdictEnum = pgEnum("verdict", [
  "likely_authentic",
  "possibly_manipulated",
  "likely_ai_generated",
  "unverified",
  "insufficient_evidence",
]);

export const classificationLevelEnum = pgEnum("classification_level", [
  "level_0",
  "level_1",
  "level_2",
  "level_3",
  "level_4",
  "level_5",
]);

export const provenanceStatusEnum = pgEnum("provenance_status", [
  "verified",
  "not_verified",
  "unavailable",
  "detected_unverified",
]);

export const severityEnum = pgEnum("severity", [
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  emailVerifiedAt: timestamp("email_verified_at"),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash"),
  authProvider: varchar("auth_provider", { length: 50 }).default("email"),
  role: varchar("role", { length: 20 }).default("user"),
  // ─── Billing (Model 1: subscription) ───
  plan: varchar("plan", { length: 20 }).default("free").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }), // "monthly" | "yearly"
  planStartedAt: timestamp("plan_started_at"),
  planRenewsAt: timestamp("plan_renews_at"),
  // ─── Billing (Model 2: pay-as-you-go credits) ───
  creditsBalance: integer("credits_balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: varchar("token", { length: 255 }).unique().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_token_idx").on(table.token),
  ]
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).unique().notNull(),
    purpose: varchar("purpose", { length: 30 }).default("magic_link").notNull(),
    redirectPath: varchar("redirect_path", { length: 500 }).default("/dashboard"),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("verification_tokens_email_idx").on(table.email),
    index("verification_tokens_token_hash_idx").on(table.tokenHash),
    index("verification_tokens_expires_at_idx").on(table.expiresAt),
  ]
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: varchar("guest_id", { length: 100 }),
    originalFilename: varchar("original_filename", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    storageProvider: varchar("storage_provider", { length: 50 }).default("local").notNull(),
    storageStatus: storageStatusEnum("storage_status").default("pending").notNull(),
    // Media metadata
    metadataStatus: metadataStatusEnum("metadata_status").default("pending").notNull(),
    metadataError: text("metadata_error"),
    duration: real("duration"),
    width: integer("width"),
    height: integer("height"),
    format: varchar("format", { length: 50 }),
    videoCodec: varchar("video_codec", { length: 50 }),
    audioCodec: varchar("audio_codec", { length: 50 }),
    frameRate: real("frame_rate"),
    // Validation
    detectedMimeType: varchar("detected_mime_type", { length: 100 }),
    isValidFile: boolean("is_valid_file"),
    validationError: text("validation_error"),
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("assets_user_id_idx").on(table.userId),
    index("assets_guest_id_idx").on(table.guestId),
    index("assets_storage_status_idx").on(table.storageStatus),
  ]
);

export const analysisJobs = pgTable(
  "analysis_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetId: uuid("asset_id")
      .references(() => assets.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: varchar("guest_id", { length: 100 }),
    status: analysisStatusEnum("status").default("queued").notNull(),
    jobType: varchar("job_type", { length: 50 }).default("full_analysis").notNull(),
    providerStatus: text("provider_status"),
    errorCode: varchar("error_code", { length: 100 }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("analysis_jobs_user_id_idx").on(table.userId),
    index("analysis_jobs_guest_id_idx").on(table.guestId),
    index("analysis_jobs_asset_id_idx").on(table.assetId),
    index("analysis_jobs_status_idx").on(table.status),
  ]
);

export const analysisResults = pgTable(
  "analysis_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisJobId: uuid("analysis_job_id")
      .references(() => analysisJobs.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    verdict: verdictEnum("verdict").notNull(),
    aiInvolvementScore: real("ai_involvement_score").notNull(),
    manipulationScore: real("manipulation_score").notNull(),
    confidenceScore: real("confidence_score").notNull(),
    classificationLevel: classificationLevelEnum("classification_level").notNull(),
    provenanceStatus: provenanceStatusEnum("provenance_status").notNull(),
    summary: text("summary"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("analysis_results_job_id_idx").on(table.analysisJobId)]
);

export const analysisSignals = pgTable(
  "analysis_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisResultId: uuid("analysis_result_id")
      .references(() => analysisResults.id, { onDelete: "cascade" })
      .notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    signalType: varchar("signal_type", { length: 100 }).notNull(),
    score: real("score"),
    severity: severityEnum("severity").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),
    timestampStart: real("timestamp_start"),
    timestampEnd: real("timestamp_end"),
    source: varchar("source", { length: 100 }).default("unknown").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("analysis_signals_result_id_idx").on(table.analysisResultId)]
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisResultId: uuid("analysis_result_id")
      .references(() => analysisResults.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    publicId: varchar("public_id", { length: 100 }).unique().notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("reports_public_id_idx").on(table.publicId),
    index("reports_result_id_idx").on(table.analysisResultId),
  ]
);

export const billingEvents = pgTable(
  "billing_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /** "subscription" | "credit_purchase" | "credit_spend" | "cancellation" */
    eventType: varchar("event_type", { length: 50 }).notNull(),
    planId: varchar("plan_id", { length: 20 }),
    packId: varchar("pack_id", { length: 50 }),
    credits: integer("credits"),
    amountUSD: real("amount_usd"),
    currency: varchar("currency", { length: 10 }).default("USD"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("billing_events_user_id_idx").on(table.userId),
    index("billing_events_type_idx").on(table.eventType),
  ]
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: varchar("guest_id", { length: 100 }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    analysisJobId: uuid("analysis_job_id").references(() => analysisJobs.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("usage_events_user_id_idx").on(table.userId),
    index("usage_events_guest_id_idx").on(table.guestId),
    index("usage_events_type_idx").on(table.eventType),
  ]
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type AnalysisJob = typeof analysisJobs.$inferSelect;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type AnalysisSignal = typeof analysisSignals.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type BillingEvent = typeof billingEvents.$inferSelect;
