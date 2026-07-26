import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const auditActorType = pgEnum("audit_actor_type", [
  "system",
  "administrator",
]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  occurredAt: timestamp("occurred_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
  actorType: auditActorType("actor_type").notNull(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details").notNull().default({}),
});
