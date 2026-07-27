import { getDatabaseConnection } from "@/db/client";
import { auditEvents } from "@/db/schema";
import type { UserRole } from "@/lib/validation/auth";

type AuditDetails = Record<string, string | number | boolean | null | string[]>;

type AuditEvent = {
  actorType: "system" | UserRole;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: AuditDetails;
};

export async function recordAuditEvent(event: AuditEvent) {
  const { db } = getDatabaseConnection();

  await db.insert(auditEvents).values({
    actorType: event.actorType,
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    details: event.details ?? {},
  });
}
