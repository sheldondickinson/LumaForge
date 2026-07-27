CREATE TYPE "public"."validation_severity" AS ENUM('information', 'recommendation', 'warning', 'critical', 'blocking');--> statement-breakpoint
CREATE TABLE "validation_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"validation_result_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "validation_overrides_reason_not_empty" CHECK (length(trim("validation_overrides"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "validation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"validation_run_id" uuid NOT NULL,
	"rule_code" text NOT NULL,
	"severity" "validation_severity" NOT NULL,
	"scope_type" text NOT NULL,
	"scope_id" uuid,
	"message" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"override_allowed" boolean DEFAULT true NOT NULL,
	CONSTRAINT "validation_results_rule_code_format" CHECK ("validation_results"."rule_code" ~ '^[A-Z][A-Z0-9_]{2,63}$'),
	CONSTRAINT "validation_results_message_not_empty" CHECK (length(trim("validation_results"."message")) > 0)
);
--> statement-breakpoint
CREATE TABLE "validation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"controller_asset_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "controller_definitions" ADD COLUMN "maximum_nodes_per_output" integer;--> statement-breakpoint
ALTER TABLE "controller_definitions" ADD COLUMN "maximum_current_per_output_a" numeric(12, 3);--> statement-breakpoint
ALTER TABLE "validation_overrides" ADD CONSTRAINT "validation_overrides_validation_result_id_validation_results_id_fk" FOREIGN KEY ("validation_result_id") REFERENCES "public"."validation_results"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_overrides" ADD CONSTRAINT "validation_overrides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_validation_run_id_validation_runs_id_fk" FOREIGN KEY ("validation_run_id") REFERENCES "public"."validation_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_controller_asset_id_controller_assets_id_fk" FOREIGN KEY ("controller_asset_id") REFERENCES "public"."controller_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "validation_overrides_result_unique" ON "validation_overrides" USING btree ("validation_result_id");--> statement-breakpoint
CREATE INDEX "validation_results_run_severity_index" ON "validation_results" USING btree ("validation_run_id","severity");--> statement-breakpoint
CREATE INDEX "validation_runs_controller_created_index" ON "validation_runs" USING btree ("controller_asset_id","created_at");--> statement-breakpoint
ALTER TABLE "controller_definitions" ADD CONSTRAINT "controller_definitions_maximum_nodes_valid" CHECK ("controller_definitions"."maximum_nodes_per_output" is null or "controller_definitions"."maximum_nodes_per_output" > 0);--> statement-breakpoint
ALTER TABLE "controller_definitions" ADD CONSTRAINT "controller_definitions_maximum_current_valid" CHECK ("controller_definitions"."maximum_current_per_output_a" is null or "controller_definitions"."maximum_current_per_output_a" > 0);--> statement-breakpoint

CREATE OR REPLACE FUNCTION protect_validation_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Validation runs, results and overrides are immutable history.';
END;
$$;--> statement-breakpoint

CREATE TRIGGER validation_runs_prevent_update
BEFORE UPDATE ON validation_runs FOR EACH ROW EXECUTE FUNCTION protect_validation_history();--> statement-breakpoint
CREATE TRIGGER validation_runs_prevent_delete
BEFORE DELETE ON validation_runs FOR EACH ROW EXECUTE FUNCTION protect_validation_history();--> statement-breakpoint
CREATE TRIGGER validation_results_prevent_update
BEFORE UPDATE ON validation_results FOR EACH ROW EXECUTE FUNCTION protect_validation_history();--> statement-breakpoint
CREATE TRIGGER validation_results_prevent_delete
BEFORE DELETE ON validation_results FOR EACH ROW EXECUTE FUNCTION protect_validation_history();--> statement-breakpoint
CREATE TRIGGER validation_overrides_prevent_update
BEFORE UPDATE ON validation_overrides FOR EACH ROW EXECUTE FUNCTION protect_validation_history();--> statement-breakpoint
CREATE TRIGGER validation_overrides_prevent_delete
BEFORE DELETE ON validation_overrides FOR EACH ROW EXECUTE FUNCTION protect_validation_history();
