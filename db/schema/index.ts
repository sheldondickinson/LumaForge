import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const auditActorType = pgEnum("audit_actor_type", [
  "system",
  "administrator",
  "editor",
  "viewer",
]);

export const userRole = pgEnum("user_role", [
  "administrator",
  "editor",
  "viewer",
]);

export const assetStatus = pgEnum("asset_status", [
  "available",
  "in_use",
  "maintenance",
  "retired",
  "lost",
  "disposed",
]);

export const locationKind = pgEnum("location_kind", [
  "shed",
  "rack",
  "shelf",
  "tote",
  "zone",
  "bin",
  "other",
]);

export const stocktakeStatus = pgEnum("stocktake_status", [
  "draft",
  "in_progress",
  "completed",
  "cancelled",
]);

export const stocktakeOutcome = pgEnum("stocktake_outcome", [
  "confirmed",
  "moved",
  "unexpected",
  "missing",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").default("administrator").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
    check(
      "users_password_hash_not_empty",
      sql`length(${table.passwordHash}) > 0`,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "date",
    }),
    userAgent: text("user_agent"),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_index").on(table.userId),
    index("sessions_expires_at_index").on(table.expiresAt),
    check(
      "sessions_expiry_after_creation",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    identifierHash: text("identifier_hash").primaryKey(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    failedCount: integer("failed_count").default(0).notNull(),
    blockedUntil: timestamp("blocked_until", {
      withTimezone: true,
      mode: "date",
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "auth_rate_limits_failed_count_valid",
      sql`${table.failedCount} >= 0`,
    ),
    index("auth_rate_limits_updated_at_index").on(table.updatedAt),
  ],
);

export const assetClasses = pgTable(
  "asset_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    identifierPrefix: text("identifier_prefix").notNull(),
    identifierPadding: integer("identifier_padding").default(6).notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("asset_classes_name_unique").on(table.name),
    uniqueIndex("asset_classes_identifier_prefix_unique").on(
      table.identifierPrefix,
    ),
    check(
      "asset_classes_identifier_prefix_format",
      sql`${table.identifierPrefix} ~ '^[A-Z][A-Z0-9]{0,11}$'`,
    ),
    check(
      "asset_classes_identifier_padding_valid",
      sql`${table.identifierPadding} between 1 and 12`,
    ),
  ],
);

export const assetIdentifierSequences = pgTable(
  "asset_identifier_sequences",
  {
    assetClassId: uuid("asset_class_id")
      .primaryKey()
      .references(() => assetClasses.id, { onDelete: "restrict" }),
    nextValue: bigint("next_value", { mode: "number" }).default(1).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "asset_identifier_sequences_next_value_valid",
      sql`${table.nextValue} > 0`,
    ),
  ],
);

export const productDefinitions = pgTable(
  "product_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetClassId: uuid("asset_class_id")
      .notNull()
      .references(() => assetClasses.id, { onDelete: "restrict" }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    index("product_definitions_asset_class_index").on(table.assetClassId),
    index("product_definitions_archived_at_index").on(table.archivedAt),
  ],
);

export const productRevisions = pgTable(
  "product_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productDefinitionId: uuid("product_definition_id")
      .notNull()
      .references(() => productDefinitions.id, { onDelete: "restrict" }),
    revisionNumber: integer("revision_number").notNull(),
    name: text("name").notNull(),
    manufacturer: text("manufacturer"),
    model: text("model"),
    description: text("description"),
    specifications: jsonb("specifications")
      .$type<Record<string, string | number | boolean | null>>()
      .default({})
      .notNull(),
    changeSummary: text("change_summary").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("product_revisions_product_revision_unique").on(
      table.productDefinitionId,
      table.revisionNumber,
    ),
    index("product_revisions_product_created_index").on(
      table.productDefinitionId,
      table.createdAt,
    ),
    check(
      "product_revisions_revision_number_valid",
      sql`${table.revisionNumber} > 0`,
    ),
    check(
      "product_revisions_name_not_empty",
      sql`length(trim(${table.name})) > 0`,
    ),
    check(
      "product_revisions_change_summary_not_empty",
      sql`length(trim(${table.changeSummary})) > 0`,
    ),
  ],
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetClassId: uuid("asset_class_id")
      .notNull()
      .references(() => assetClasses.id, { onDelete: "restrict" }),
    productRevisionId: uuid("product_revision_id").references(
      () => productRevisions.id,
      { onDelete: "restrict" },
    ),
    assetIdentifier: text("asset_identifier").notNull(),
    friendlyName: text("friendly_name").notNull(),
    status: assetStatus("status").default("available").notNull(),
    specificationOverrides: jsonb("specification_overrides")
      .$type<Record<string, string | number | boolean | null>>()
      .default({})
      .notNull(),
    overrideReason: text("override_reason"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    retiredAt: timestamp("retired_at", {
      withTimezone: true,
      mode: "date",
    }),
    retirementReason: text("retirement_reason"),
  },
  (table) => [
    uniqueIndex("assets_asset_identifier_unique").on(table.assetIdentifier),
    index("assets_asset_class_index").on(table.assetClassId),
    index("assets_product_revision_index").on(table.productRevisionId),
    index("assets_status_index").on(table.status),
    index("assets_friendly_name_index").on(table.friendlyName),
    check(
      "assets_asset_identifier_format",
      sql`${table.assetIdentifier} ~ '^[A-Z][A-Z0-9]{0,11}-[0-9]+$'`,
    ),
    check(
      "assets_friendly_name_not_empty",
      sql`length(trim(${table.friendlyName})) > 0`,
    ),
    check(
      "assets_override_reason_required",
      sql`${table.specificationOverrides} = '{}'::jsonb or length(trim(coalesce(${table.overrideReason}, ''))) > 0`,
    ),
    check(
      "assets_retirement_consistent",
      sql`(${table.status} = 'retired' and ${table.retiredAt} is not null and length(trim(coalesce(${table.retirementReason}, ''))) > 0) or (${table.status} <> 'retired' and ${table.retiredAt} is null and ${table.retirementReason} is null)`,
    ),
  ],
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, {
      onDelete: "restrict",
    }),
    kind: locationKind("kind").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    uniqueIndex("locations_code_unique").on(table.code),
    index("locations_parent_index").on(table.parentId),
    index("locations_kind_index").on(table.kind),
    index("locations_archived_at_index").on(table.archivedAt),
    check(
      "locations_code_format",
      sql`${table.code} ~ '^[A-Z][A-Z0-9-]{1,31}$'`,
    ),
    check("locations_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check(
      "locations_not_own_parent",
      sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`,
    ),
  ],
);

export const assetLocationAssignments = pgTable(
  "asset_location_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "restrict" }),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "restrict",
    }),
    startedAt: timestamp("started_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", {
      withTimezone: true,
      mode: "date",
    }),
    reason: text("reason").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("asset_location_assignments_current_asset_unique")
      .on(table.assetId)
      .where(sql`${table.endedAt} is null`),
    index("asset_location_assignments_asset_started_index").on(
      table.assetId,
      table.startedAt,
    ),
    index("asset_location_assignments_location_current_index").on(
      table.locationId,
      table.endedAt,
    ),
    check(
      "asset_location_assignments_reason_not_empty",
      sql`length(trim(${table.reason})) > 0`,
    ),
    check(
      "asset_location_assignments_dates_valid",
      sql`${table.endedAt} is null or ${table.endedAt} >= ${table.startedAt}`,
    ),
  ],
);

export const stocktakes = pgTable(
  "stocktakes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    status: stocktakeStatus("status").default("draft").notNull(),
    notes: text("notes"),
    startedAt: timestamp("started_at", {
      withTimezone: true,
      mode: "date",
    }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("stocktakes_location_created_index").on(
      table.locationId,
      table.createdAt,
    ),
    index("stocktakes_status_index").on(table.status),
    check("stocktakes_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check(
      "stocktakes_lifecycle_consistent",
      sql`(${table.status} = 'draft' and ${table.startedAt} is null and ${table.completedAt} is null) or (${table.status} = 'in_progress' and ${table.startedAt} is not null and ${table.completedAt} is null) or (${table.status} = 'completed' and ${table.startedAt} is not null and ${table.completedAt} is not null and ${table.completedAt} >= ${table.startedAt}) or (${table.status} = 'cancelled' and ${table.completedAt} is null)`,
    ),
  ],
);

export const stocktakeEntries = pgTable(
  "stocktake_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stocktakeId: uuid("stocktake_id")
      .notNull()
      .references(() => stocktakes.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "restrict" }),
    expectedLocationId: uuid("expected_location_id").references(
      () => locations.id,
      { onDelete: "restrict" },
    ),
    observedLocationId: uuid("observed_location_id").references(
      () => locations.id,
      { onDelete: "restrict" },
    ),
    outcome: stocktakeOutcome("outcome").notNull(),
    scannedAt: timestamp("scanned_at", {
      withTimezone: true,
      mode: "date",
    }),
    scannedBy: uuid("scanned_by").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("stocktake_entries_stocktake_asset_unique").on(
      table.stocktakeId,
      table.assetId,
    ),
    index("stocktake_entries_stocktake_outcome_index").on(
      table.stocktakeId,
      table.outcome,
    ),
    check(
      "stocktake_entries_scan_consistent",
      sql`(${table.outcome} = 'missing' and ${table.scannedAt} is null and ${table.scannedBy} is null) or (${table.outcome} <> 'missing' and ${table.scannedAt} is not null)`,
    ),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    actorType: auditActorType("actor_type").notNull(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    details: jsonb("details").notNull().default({}),
  },
  (table) => [
    index("audit_events_entity_index").on(
      table.entityType,
      table.entityId,
      table.occurredAt,
    ),
    index("audit_events_actor_index").on(table.actorId, table.occurredAt),
  ],
);
