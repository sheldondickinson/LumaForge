CREATE TABLE "controller_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"controller_definition_id" uuid NOT NULL,
	"controller_code" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "controller_assets_code_format" CHECK ("controller_assets"."controller_code" ~ '^[A-Z][A-Z0-9]{0,7}$')
);
--> statement-breakpoint
CREATE TABLE "controller_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"protocol" text,
	"output_count" integer NOT NULL,
	"power_bank_count" integer NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "controller_definitions_name_not_empty" CHECK (length(trim("controller_definitions"."name")) > 0),
	CONSTRAINT "controller_definitions_output_count_valid" CHECK ("controller_definitions"."output_count" between 1 and 128),
	CONSTRAINT "controller_definitions_power_bank_count_valid" CHECK ("controller_definitions"."power_bank_count" between 1 and 32)
);
--> statement-breakpoint
CREATE TABLE "controller_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"controller_asset_id" uuid NOT NULL,
	"power_bank_id" uuid NOT NULL,
	"output_number" integer NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "controller_outputs_number_valid" CHECK ("controller_outputs"."output_number" > 0),
	CONSTRAINT "controller_outputs_name_not_empty" CHECK (length(trim("controller_outputs"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "output_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"controller_output_id" uuid NOT NULL,
	"display_element_id" uuid NOT NULL,
	"component_position_id" uuid NOT NULL,
	"prop_number" integer NOT NULL,
	"string_number" integer NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"reason" text NOT NULL,
	"created_by" uuid,
	CONSTRAINT "output_assignments_prop_number_valid" CHECK ("output_assignments"."prop_number" between 1 and 999),
	CONSTRAINT "output_assignments_string_number_valid" CHECK ("output_assignments"."string_number" between 1 and 99),
	CONSTRAINT "output_assignments_dates_valid" CHECK ("output_assignments"."effective_to" is null or "output_assignments"."effective_to" >= "output_assignments"."effective_from"),
	CONSTRAINT "output_assignments_reason_not_empty" CHECK (length(trim("output_assignments"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "power_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psu_asset_id" uuid NOT NULL,
	"power_bank_id" uuid NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"reason" text NOT NULL,
	"created_by" uuid,
	CONSTRAINT "power_allocations_dates_valid" CHECK ("power_allocations"."effective_to" is null or "power_allocations"."effective_to" >= "power_allocations"."effective_from"),
	CONSTRAINT "power_allocations_reason_not_empty" CHECK (length(trim("power_allocations"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "power_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"controller_asset_id" uuid NOT NULL,
	"bank_number" integer NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "power_banks_number_valid" CHECK ("power_banks"."bank_number" > 0),
	CONSTRAINT "power_banks_name_not_empty" CHECK (length(trim("power_banks"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "psu_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"psu_definition_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psu_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"output_voltage_v" numeric(10, 3) NOT NULL,
	"maximum_current_a" numeric(12, 3) NOT NULL,
	"maximum_power_w" numeric(12, 3) NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psu_definitions_name_not_empty" CHECK (length(trim("psu_definitions"."name")) > 0),
	CONSTRAINT "psu_definitions_ratings_valid" CHECK ("psu_definitions"."output_voltage_v" > 0 and "psu_definitions"."maximum_current_a" > 0 and "psu_definitions"."maximum_power_w" > 0)
);
--> statement-breakpoint
ALTER TABLE "controller_assets" ADD CONSTRAINT "controller_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controller_assets" ADD CONSTRAINT "controller_assets_controller_definition_id_controller_definitions_id_fk" FOREIGN KEY ("controller_definition_id") REFERENCES "public"."controller_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controller_assets" ADD CONSTRAINT "controller_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controller_definitions" ADD CONSTRAINT "controller_definitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controller_outputs" ADD CONSTRAINT "controller_outputs_controller_asset_id_controller_assets_id_fk" FOREIGN KEY ("controller_asset_id") REFERENCES "public"."controller_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controller_outputs" ADD CONSTRAINT "controller_outputs_power_bank_id_power_banks_id_fk" FOREIGN KEY ("power_bank_id") REFERENCES "public"."power_banks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "output_assignments" ADD CONSTRAINT "output_assignments_controller_output_id_controller_outputs_id_fk" FOREIGN KEY ("controller_output_id") REFERENCES "public"."controller_outputs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "output_assignments" ADD CONSTRAINT "output_assignments_display_element_id_display_elements_id_fk" FOREIGN KEY ("display_element_id") REFERENCES "public"."display_elements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "output_assignments" ADD CONSTRAINT "output_assignments_component_position_id_component_positions_id_fk" FOREIGN KEY ("component_position_id") REFERENCES "public"."component_positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "output_assignments" ADD CONSTRAINT "output_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_allocations" ADD CONSTRAINT "power_allocations_psu_asset_id_psu_assets_id_fk" FOREIGN KEY ("psu_asset_id") REFERENCES "public"."psu_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_allocations" ADD CONSTRAINT "power_allocations_power_bank_id_power_banks_id_fk" FOREIGN KEY ("power_bank_id") REFERENCES "public"."power_banks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_allocations" ADD CONSTRAINT "power_allocations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_banks" ADD CONSTRAINT "power_banks_controller_asset_id_controller_assets_id_fk" FOREIGN KEY ("controller_asset_id") REFERENCES "public"."controller_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psu_assets" ADD CONSTRAINT "psu_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psu_assets" ADD CONSTRAINT "psu_assets_psu_definition_id_psu_definitions_id_fk" FOREIGN KEY ("psu_definition_id") REFERENCES "public"."psu_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psu_assets" ADD CONSTRAINT "psu_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psu_definitions" ADD CONSTRAINT "psu_definitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "controller_assets_asset_unique" ON "controller_assets" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "controller_assets_code_unique" ON "controller_assets" USING btree ("controller_code");--> statement-breakpoint
CREATE UNIQUE INDEX "controller_outputs_controller_number_unique" ON "controller_outputs" USING btree ("controller_asset_id","output_number");--> statement-breakpoint
CREATE UNIQUE INDEX "output_assignments_current_position_unique" ON "output_assignments" USING btree ("component_position_id") WHERE "output_assignments"."effective_to" is null;--> statement-breakpoint
CREATE INDEX "output_assignments_output_current_index" ON "output_assignments" USING btree ("controller_output_id","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "power_allocations_current_bank_unique" ON "power_allocations" USING btree ("power_bank_id") WHERE "power_allocations"."effective_to" is null;--> statement-breakpoint
CREATE INDEX "power_allocations_psu_current_index" ON "power_allocations" USING btree ("psu_asset_id","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "power_banks_controller_number_unique" ON "power_banks" USING btree ("controller_asset_id","bank_number");--> statement-breakpoint
CREATE UNIQUE INDEX "psu_assets_asset_unique" ON "psu_assets" USING btree ("asset_id");--> statement-breakpoint

CREATE OR REPLACE FUNCTION validate_specialised_asset_class()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actual_prefix text;
  required_prefix text;
BEGIN
  required_prefix := CASE TG_TABLE_NAME
    WHEN 'controller_assets' THEN 'CTRL'
    WHEN 'psu_assets' THEN 'PSU'
  END;

  SELECT asset_classes.identifier_prefix
  INTO actual_prefix
  FROM assets
  INNER JOIN asset_classes ON asset_classes.id = assets.asset_class_id
  WHERE assets.id = NEW.asset_id;

  IF actual_prefix IS DISTINCT FROM required_prefix THEN
    RAISE EXCEPTION 'The physical asset class does not match this specialisation.';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER controller_assets_validate_class
BEFORE INSERT OR UPDATE ON controller_assets
FOR EACH ROW EXECUTE FUNCTION validate_specialised_asset_class();--> statement-breakpoint

CREATE TRIGGER psu_assets_validate_class
BEFORE INSERT OR UPDATE ON psu_assets
FOR EACH ROW EXECUTE FUNCTION validate_specialised_asset_class();--> statement-breakpoint

CREATE OR REPLACE FUNCTION validate_controller_output_bank()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM power_banks
    WHERE id = NEW.power_bank_id
      AND controller_asset_id = NEW.controller_asset_id
  ) THEN
    RAISE EXCEPTION 'A controller output power bank must belong to the same controller.';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER controller_outputs_validate_bank
BEFORE INSERT OR UPDATE ON controller_outputs
FOR EACH ROW EXECUTE FUNCTION validate_controller_output_bank();--> statement-breakpoint

CREATE OR REPLACE FUNCTION validate_output_assignment_position()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM component_positions
    WHERE id = NEW.component_position_id
      AND display_element_id = NEW.display_element_id
  ) THEN
    RAISE EXCEPTION 'The component position must belong to the assigned display element.';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER output_assignments_validate_position
BEFORE INSERT OR UPDATE ON output_assignments
FOR EACH ROW EXECUTE FUNCTION validate_output_assignment_position();--> statement-breakpoint

CREATE OR REPLACE FUNCTION protect_effective_assignment_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.effective_to IS NOT NULL THEN
    RAISE EXCEPTION 'Historical controller and power assignments are immutable.';
  END IF;
  IF to_jsonb(NEW) - 'effective_to' IS DISTINCT FROM to_jsonb(OLD) - 'effective_to'
    OR NEW.effective_to IS NULL
  THEN
    RAISE EXCEPTION 'An active controller or power assignment may only be closed.';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER output_assignments_protect_history
BEFORE UPDATE ON output_assignments
FOR EACH ROW EXECUTE FUNCTION protect_effective_assignment_history();--> statement-breakpoint

CREATE TRIGGER power_allocations_protect_history
BEFORE UPDATE ON power_allocations
FOR EACH ROW EXECUTE FUNCTION protect_effective_assignment_history();--> statement-breakpoint

CREATE OR REPLACE FUNCTION protect_controller_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.controller_code IS DISTINCT FROM OLD.controller_code
    OR NEW.asset_id IS DISTINCT FROM OLD.asset_id
  THEN
    RAISE EXCEPTION 'Controller code and permanent asset identity are immutable.';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER controller_assets_protect_identity
BEFORE UPDATE ON controller_assets
FOR EACH ROW EXECUTE FUNCTION protect_controller_code();--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_controller_power_history_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Controller and power history cannot be hard-deleted.';
END;
$$;--> statement-breakpoint

CREATE TRIGGER controller_definitions_prevent_delete BEFORE DELETE ON controller_definitions FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();--> statement-breakpoint
CREATE TRIGGER controller_assets_prevent_delete BEFORE DELETE ON controller_assets FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();--> statement-breakpoint
CREATE TRIGGER power_banks_prevent_delete BEFORE DELETE ON power_banks FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();--> statement-breakpoint
CREATE TRIGGER controller_outputs_prevent_delete BEFORE DELETE ON controller_outputs FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();--> statement-breakpoint
CREATE TRIGGER output_assignments_prevent_delete BEFORE DELETE ON output_assignments FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();--> statement-breakpoint
CREATE TRIGGER psu_definitions_prevent_delete BEFORE DELETE ON psu_definitions FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();--> statement-breakpoint
CREATE TRIGGER psu_assets_prevent_delete BEFORE DELETE ON psu_assets FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();--> statement-breakpoint
CREATE TRIGGER power_allocations_prevent_delete BEFORE DELETE ON power_allocations FOR EACH ROW EXECUTE FUNCTION prevent_controller_power_history_delete();
