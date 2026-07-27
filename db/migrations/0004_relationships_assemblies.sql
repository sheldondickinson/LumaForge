CREATE TYPE "public"."asset_relationship_type" AS ENUM('contains', 'mounted_on', 'connected_to', 'component_of');--> statement-breakpoint
CREATE TABLE "asset_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_type" "asset_relationship_type" NOT NULL,
	"source_asset_id" uuid NOT NULL,
	"target_asset_id" uuid NOT NULL,
	"component_position_id" uuid,
	"source_connector" text,
	"target_connector" text,
	"sequence" integer,
	"configuration_revision" integer DEFAULT 1 NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"notes" text,
	"created_by" uuid,
	CONSTRAINT "asset_relationships_distinct_assets" CHECK ("asset_relationships"."source_asset_id" <> "asset_relationships"."target_asset_id"),
	CONSTRAINT "asset_relationships_revision_valid" CHECK ("asset_relationships"."configuration_revision" > 0),
	CONSTRAINT "asset_relationships_dates_valid" CHECK ("asset_relationships"."effective_to" is null or "asset_relationships"."effective_to" >= "asset_relationships"."effective_from"),
	CONSTRAINT "asset_relationships_position_type_valid" CHECK ("asset_relationships"."component_position_id" is null or "asset_relationships"."relationship_type" = 'component_of')
);
--> statement-breakpoint
CREATE TABLE "component_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_element_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"sequence" integer NOT NULL,
	"connector" text,
	"notes" text,
	CONSTRAINT "component_positions_code_format" CHECK ("component_positions"."code" ~ '^[A-Z][A-Z0-9-]{0,31}$'),
	CONSTRAINT "component_positions_name_not_empty" CHECK (length(trim("component_positions"."name")) > 0),
	CONSTRAINT "component_positions_sequence_valid" CHECK ("component_positions"."sequence" > 0)
);
--> statement-breakpoint
CREATE TABLE "display_elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "display_elements_name_not_empty" CHECK (length(trim("display_elements"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_source_asset_id_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_target_asset_id_assets_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_component_position_id_component_positions_id_fk" FOREIGN KEY ("component_position_id") REFERENCES "public"."component_positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_positions" ADD CONSTRAINT "component_positions_display_element_id_display_elements_id_fk" FOREIGN KEY ("display_element_id") REFERENCES "public"."display_elements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_elements" ADD CONSTRAINT "display_elements_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_elements" ADD CONSTRAINT "display_elements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_relationships_current_position_unique" ON "asset_relationships" USING btree ("component_position_id") WHERE "asset_relationships"."effective_to" is null;--> statement-breakpoint
CREATE INDEX "asset_relationships_source_effective_index" ON "asset_relationships" USING btree ("source_asset_id","effective_to");--> statement-breakpoint
CREATE INDEX "asset_relationships_target_effective_index" ON "asset_relationships" USING btree ("target_asset_id","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "component_positions_element_code_unique" ON "component_positions" USING btree ("display_element_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "component_positions_element_sequence_unique" ON "component_positions" USING btree ("display_element_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "display_elements_asset_unique" ON "display_elements" USING btree ("asset_id");--> statement-breakpoint

CREATE OR REPLACE FUNCTION validate_asset_relationship()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  position_source_asset_id uuid;
BEGIN
  IF NEW.component_position_id IS NOT NULL THEN
    SELECT display_elements.asset_id
    INTO position_source_asset_id
    FROM component_positions
    INNER JOIN display_elements
      ON display_elements.id = component_positions.display_element_id
    WHERE component_positions.id = NEW.component_position_id;

    IF position_source_asset_id IS DISTINCT FROM NEW.source_asset_id THEN
      RAISE EXCEPTION 'A component position must belong to the source display element.';
    END IF;
  END IF;

  IF NEW.effective_to IS NULL
    AND NEW.relationship_type IN ('contains', 'component_of')
    AND EXISTS (
      WITH RECURSIVE descendants AS (
        SELECT target_asset_id
        FROM asset_relationships
        WHERE source_asset_id = NEW.target_asset_id
          AND effective_to IS NULL
          AND relationship_type IN ('contains', 'component_of')

        UNION

        SELECT asset_relationships.target_asset_id
        FROM asset_relationships
        INNER JOIN descendants
          ON asset_relationships.source_asset_id = descendants.target_asset_id
        WHERE asset_relationships.effective_to IS NULL
          AND asset_relationships.relationship_type IN ('contains', 'component_of')
      )
      SELECT 1 FROM descendants WHERE target_asset_id = NEW.source_asset_id
    )
  THEN
    RAISE EXCEPTION 'An assembly relationship cannot create a circular assembly.';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER asset_relationships_validate
BEFORE INSERT OR UPDATE ON asset_relationships
FOR EACH ROW
EXECUTE FUNCTION validate_asset_relationship();--> statement-breakpoint

CREATE OR REPLACE FUNCTION protect_asset_relationship_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.effective_to IS NOT NULL THEN
    RAISE EXCEPTION 'Historical asset relationships are immutable.';
  END IF;

  IF NEW.relationship_type IS DISTINCT FROM OLD.relationship_type
    OR NEW.source_asset_id IS DISTINCT FROM OLD.source_asset_id
    OR NEW.target_asset_id IS DISTINCT FROM OLD.target_asset_id
    OR NEW.component_position_id IS DISTINCT FROM OLD.component_position_id
    OR NEW.source_connector IS DISTINCT FROM OLD.source_connector
    OR NEW.target_connector IS DISTINCT FROM OLD.target_connector
    OR NEW.sequence IS DISTINCT FROM OLD.sequence
    OR NEW.configuration_revision IS DISTINCT FROM OLD.configuration_revision
    OR NEW.effective_from IS DISTINCT FROM OLD.effective_from
    OR NEW.notes IS DISTINCT FROM OLD.notes
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.effective_to IS NULL
  THEN
    RAISE EXCEPTION 'An active asset relationship may only be closed.';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER asset_relationships_protect_history
BEFORE UPDATE ON asset_relationships
FOR EACH ROW
EXECUTE FUNCTION protect_asset_relationship_history();--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_assembly_history_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Assembly and relationship history cannot be hard-deleted.';
END;
$$;--> statement-breakpoint

CREATE TRIGGER asset_relationships_prevent_delete
BEFORE DELETE ON asset_relationships
FOR EACH ROW
EXECUTE FUNCTION prevent_assembly_history_delete();--> statement-breakpoint

CREATE TRIGGER component_positions_prevent_delete
BEFORE DELETE ON component_positions
FOR EACH ROW
EXECUTE FUNCTION prevent_assembly_history_delete();--> statement-breakpoint

CREATE TRIGGER display_elements_prevent_delete
BEFORE DELETE ON display_elements
FOR EACH ROW
EXECUTE FUNCTION prevent_assembly_history_delete();
