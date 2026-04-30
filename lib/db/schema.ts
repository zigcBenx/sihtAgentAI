import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ─── Auth.js required tables ────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Application tables ─────────────────────────────────────────────

export const sihtAgents = sqliteTable("siht_agents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  agentType: text("agent_type").notNull().default("job_search"), // "job_search" | "company_watcher"
  desiredRole: text("desired_role"),
  profileSummary: text("profile_summary"),
  searchTerms: text("search_terms"), // JSON string: string[]
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  locationPreference: text("location_preference"),
  specificCity: text("specific_city"),
  frequency: text("frequency").notNull().default("daily"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  lastRunAt: integer("last_run_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const watchedCompanies = sqliteTable("watched_companies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id")
    .notNull()
    .references(() => sihtAgents.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  careersUrl: text("careers_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Job matches found by general job search (MojeDelo, Optius, etc.)
export const jobMatches = sqliteTable("job_matches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id")
    .notNull()
    .references(() => sihtAgents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  url: text("url").notNull(),
  source: text("source").notNull(), // "mojedelo" | "optius" | "ess" | "inzaposlitev" | "careerjet"
  externalId: text("external_id"), // dedup key from source
  seen: integer("seen", { mode: "boolean" }).notNull().default(false),
  foundAt: integer("found_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Alerts for watched companies — when a company posts any new position
export const companyAlerts = sqliteTable("company_alerts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  watchedCompanyId: text("watched_company_id")
    .notNull()
    .references(() => watchedCompanies.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => sihtAgents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull(),
  externalId: text("external_id"),
  seen: integer("seen", { mode: "boolean" }).notNull().default(false),
  foundAt: integer("found_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Execution logs — one row per agent run
export const runLogs = sqliteTable("run_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id")
    .notNull()
    .references(() => sihtAgents.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "success" | "partial" | "error"
  durationMs: integer("duration_ms"),
  log: text("log").notNull(), // JSON string of LogEntry[]
  summary: text("summary").notNull(), // Human-readable one-liner
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Relations ──────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  agents: many(sihtAgents),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const sihtAgentsRelations = relations(sihtAgents, ({ one, many }) => ({
  user: one(users, {
    fields: [sihtAgents.userId],
    references: [users.id],
  }),
  watchedCompanies: many(watchedCompanies),
  jobMatches: many(jobMatches),
  companyAlerts: many(companyAlerts),
  runLogs: many(runLogs),
}));

export const watchedCompaniesRelations = relations(
  watchedCompanies,
  ({ one, many }) => ({
    agent: one(sihtAgents, {
      fields: [watchedCompanies.agentId],
      references: [sihtAgents.id],
    }),
    alerts: many(companyAlerts),
  })
);

export const jobMatchesRelations = relations(jobMatches, ({ one }) => ({
  agent: one(sihtAgents, {
    fields: [jobMatches.agentId],
    references: [sihtAgents.id],
  }),
}));

export const companyAlertsRelations = relations(companyAlerts, ({ one }) => ({
  agent: one(sihtAgents, {
    fields: [companyAlerts.agentId],
    references: [sihtAgents.id],
  }),
  watchedCompany: one(watchedCompanies, {
    fields: [companyAlerts.watchedCompanyId],
    references: [watchedCompanies.id],
  }),
}));

export const runLogsRelations = relations(runLogs, ({ one }) => ({
  agent: one(sihtAgents, {
    fields: [runLogs.agentId],
    references: [sihtAgents.id],
  }),
}));
