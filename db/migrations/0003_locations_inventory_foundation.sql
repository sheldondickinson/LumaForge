CREATE TYPE "public"."location_kind" AS ENUM('shed', 'rack', 'shelf', 'tote', 'zone', 'bin', 'other');--> statement-breakpoint
CREATE TYPE "public"."stocktake_outcome" AS ENUM('confirmed', 'moved', 'unexpected', 'missing');--> statement-breakpoint
CREATE TYPE "public"."stocktake_status" AS ENUM('draft', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "asset_location_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"location_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"reason" text NOT NULL,
	"created_by" uuid,
	CONSTRAINT "asset_location_assignments_reason_not_empty" CHECK (length(trim("asset_location_assignments"."reason")) > 0),
	CONSTRAINT "asset_location_assignments_dates_valid" CHECK ("asset_location_assignments"."ended_at" is null or "asset_location_assignments"."ended_at" >= "asset_location_assignments"."started_at")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"kind" "location_kind" NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "locations_code_format" CHECK ("locations"."code" ~ '^[A-Z][A-Z0-9-]{1,31}$'),
	CONSTRAINT "locations_name_not_empty" CHECK (length(trim("locations"."name")) > 0),
	CONSTRAINT "locations_not_own_parent" CHECK ("locations"."parent_id" is null or "locations"."parent_id" <> "locations"."id")
);
--> statement-breakpoint
CREATE TABLE "stocktake_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stocktake_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"expected_location_id" uuid,
	"observed_location_id" uuid,
	"outcome" "stocktake_outcome" NOT NULL,
	"scanned_at" timestamp with time zone,
	"scanned_by" uuid,
	"notes" text,
	CONSTRAINT "stocktake_entries_scan_consistent" CHECK (("stocktake_entries"."outcome" = 'missing' and "stocktake_entries"."scanned_at" is null and "stocktake_entries"."scanned_by" is null) or ("stocktake_entries"."outcome" <> 'missing' and "stocktake_entries"."scanned_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "stocktakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "stocktake_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"completed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stocktakes_name_not_empty" CHECK (length(trim("stocktakes"."name")) > 0),
	CONSTRAINT "stocktakes_lifecycle_consistent" CHECK (("stocktakes"."status" = 'draft' and "stocktakes"."started_at" is null and "stocktakes"."completed_at" is null) or ("stocktakes"."status" = 'in_progress' and "stocktakes"."started_at" is not null and "stocktakes"."completed_at" is null) or ("stocktakes"."status" = 'completed' and "stocktakes"."started_at" is not null and "stocktakes"."completed_at" is not null and "stocktakes"."completed_at" >= "stocktakes"."started_at") or ("stocktakes"."status" = 'cancelled' and "stocktakes"."completed_at" is null))
);
--> statement-breakpoint
ALTER TABLE "asset_location_assignments" ADD CONSTRAINT "asset_location_assignments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_location_assignments" ADD CONSTRAINT "asset_location_assignments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_location_assignments" ADD CONSTRAINT "asset_location_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_entries" ADD CONSTRAINT "stocktake_entries_stocktake_id_stocktakes_id_fk" FOREIGN KEY ("stocktake_id") REFERENCES "public"."stocktakes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_entries" ADD CONSTRAINT "stocktake_entries_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_entries" ADD CONSTRAINT "stocktake_entries_expected_location_id_locations_id_fk" FOREIGN KEY ("expected_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_entries" ADD CONSTRAINT "stocktake_entries_observed_location_id_locations_id_fk" FOREIGN KEY ("observed_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_entries" ADD CONSTRAINT "stocktake_entries_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_location_assignments_current_asset_unique" ON "asset_location_assignments" USING btree ("asset_id") WHERE "asset_location_assignments"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "asset_location_assignments_asset_started_index" ON "asset_location_assignments" USING btree ("asset_id","started_at");--> statement-breakpoint
CREATE INDEX "asset_location_assignments_location_current_index" ON "asset_location_assignments" USING btree ("location_id","ended_at");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_unique" ON "locations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "locations_parent_index" ON "locations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "locations_kind_index" ON "locations" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "locations_archived_at_index" ON "locations" USING btree ("archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stocktake_entries_stocktake_asset_unique" ON "stocktake_entries" USING btree ("stocktake_id","asset_id");--> statement-breakpoint
CREATE INDEX "stocktake_entries_stocktake_outcome_index" ON "stocktake_entries" USING btree ("stocktake_id","outcome");--> statement-breakpoint
CREATE INDEX "stocktakes_location_created_index" ON "stocktakes" USING btree ("location_id","created_at");--> statement-breakpoint
CREATE INDEX "stocktakes_status_index" ON "stocktakes" USING btree ("status");--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_location_cycle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id
      FROM locations
      WHERE id = NEW.parent_id

      UNION ALL

      SELECT locations.id, locations.parent_id
      FROM locations
      INNER JOIN ancestors ON locations.id = ancestors.parent_id
    )
    SELECT 1
    FROM ancestors
    WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'A location cannot be placed inside itself or one of its descendants.';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER locations_prevent_cycle
BEFORE INSERT OR UPDATE OF parent_id ON locations
FOR EACH ROW
EXECUTE FUNCTION prevent_location_cycle();--> statement-breakpoint

CREATE OR REPLACE FUNCTION protect_location_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'Location codes are permanent after creation.';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER locations_protect_identity
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION protect_location_identity();--> statement-breakpoint

CREATE OR REPLACE FUNCTION protect_asset_location_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'Historical asset location assignments are immutable.';
  END IF;

  IF NEW.asset_id IS DISTINCT FROM OLD.asset_id
    OR NEW.location_id IS DISTINCT FROM OLD.location_id
    OR NEW.started_at IS DISTINCT FROM OLD.started_at
    OR NEW.reason IS DISTINCT FROM OLD.reason
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.ended_at IS NULL
  THEN
    RAISE EXCEPTION 'Asset location assignments may only be closed.';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER asset_location_assignments_protect_history
BEFORE UPDATE ON asset_location_assignments
FOR EACH ROW
EXECUTE FUNCTION protect_asset_location_history();--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_inventory_history_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Inventory and location history cannot be hard-deleted.';
END;
$$;--> statement-breakpoint

CREATE TRIGGER locations_prevent_delete
BEFORE DELETE ON locations
FOR EACH ROW
EXECUTE FUNCTION prevent_inventory_history_delete();--> statement-breakpoint

CREATE TRIGGER asset_location_assignments_prevent_delete
BEFORE DELETE ON asset_location_assignments
FOR EACH ROW
EXECUTE FUNCTION prevent_inventory_history_delete();--> statement-breakpoint

CREATE TRIGGER stocktakes_prevent_delete
BEFORE DELETE ON stocktakes
FOR EACH ROW
EXECUTE FUNCTION prevent_inventory_history_delete();--> statement-breakpoint

CREATE TRIGGER stocktake_entries_prevent_delete
BEFORE DELETE ON stocktake_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_inventory_history_delete();
