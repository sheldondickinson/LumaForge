CREATE TYPE "public"."asset_status" AS ENUM('available', 'in_use', 'maintenance', 'retired', 'lost', 'disposed');--> statement-breakpoint
CREATE TABLE "asset_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"identifier_prefix" text NOT NULL,
	"identifier_padding" integer DEFAULT 6 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_classes_identifier_prefix_format" CHECK ("asset_classes"."identifier_prefix" ~ '^[A-Z][A-Z0-9]{0,11}$'),
	CONSTRAINT "asset_classes_identifier_padding_valid" CHECK ("asset_classes"."identifier_padding" between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE "asset_identifier_sequences" (
	"asset_class_id" uuid PRIMARY KEY NOT NULL,
	"next_value" bigint DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_identifier_sequences_next_value_valid" CHECK ("asset_identifier_sequences"."next_value" > 0)
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_class_id" uuid NOT NULL,
	"product_revision_id" uuid,
	"asset_identifier" text NOT NULL,
	"friendly_name" text NOT NULL,
	"status" "asset_status" DEFAULT 'available' NOT NULL,
	"specification_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"override_reason" text,
	"notes" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone,
	"retirement_reason" text,
	CONSTRAINT "assets_asset_identifier_format" CHECK ("assets"."asset_identifier" ~ '^[A-Z][A-Z0-9]{0,11}-[0-9]+$'),
	CONSTRAINT "assets_friendly_name_not_empty" CHECK (length(trim("assets"."friendly_name")) > 0),
	CONSTRAINT "assets_override_reason_required" CHECK ("assets"."specification_overrides" = '{}'::jsonb or length(trim(coalesce("assets"."override_reason", ''))) > 0),
	CONSTRAINT "assets_retirement_consistent" CHECK (("assets"."status" = 'retired' and "assets"."retired_at" is not null and length(trim(coalesce("assets"."retirement_reason", ''))) > 0) or ("assets"."status" <> 'retired' and "assets"."retired_at" is null and "assets"."retirement_reason" is null))
);
--> statement-breakpoint
CREATE TABLE "product_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_class_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_definition_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"description" text,
	"specifications" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"change_summary" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_revisions_revision_number_valid" CHECK ("product_revisions"."revision_number" > 0),
	CONSTRAINT "product_revisions_name_not_empty" CHECK (length(trim("product_revisions"."name")) > 0),
	CONSTRAINT "product_revisions_change_summary_not_empty" CHECK (length(trim("product_revisions"."change_summary")) > 0)
);
--> statement-breakpoint
ALTER TABLE "asset_identifier_sequences" ADD CONSTRAINT "asset_identifier_sequences_asset_class_id_asset_classes_id_fk" FOREIGN KEY ("asset_class_id") REFERENCES "public"."asset_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_class_id_asset_classes_id_fk" FOREIGN KEY ("asset_class_id") REFERENCES "public"."asset_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_product_revision_id_product_revisions_id_fk" FOREIGN KEY ("product_revision_id") REFERENCES "public"."product_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_definitions" ADD CONSTRAINT "product_definitions_asset_class_id_asset_classes_id_fk" FOREIGN KEY ("asset_class_id") REFERENCES "public"."asset_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_definitions" ADD CONSTRAINT "product_definitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_product_definition_id_product_definitions_id_fk" FOREIGN KEY ("product_definition_id") REFERENCES "public"."product_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_classes_name_unique" ON "asset_classes" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_classes_identifier_prefix_unique" ON "asset_classes" USING btree ("identifier_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_asset_identifier_unique" ON "assets" USING btree ("asset_identifier");--> statement-breakpoint
CREATE INDEX "assets_asset_class_index" ON "assets" USING btree ("asset_class_id");--> statement-breakpoint
CREATE INDEX "assets_product_revision_index" ON "assets" USING btree ("product_revision_id");--> statement-breakpoint
CREATE INDEX "assets_status_index" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assets_friendly_name_index" ON "assets" USING btree ("friendly_name");--> statement-breakpoint
CREATE INDEX "product_definitions_asset_class_index" ON "product_definitions" USING btree ("asset_class_id");--> statement-breakpoint
CREATE INDEX "product_definitions_archived_at_index" ON "product_definitions" USING btree ("archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_revisions_product_revision_unique" ON "product_revisions" USING btree ("product_definition_id","revision_number");--> statement-breakpoint
CREATE INDEX "product_revisions_product_created_index" ON "product_revisions" USING btree ("product_definition_id","created_at");--> statement-breakpoint
CREATE FUNCTION prevent_product_revision_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'Product revisions are immutable; create a new revision instead.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER product_revisions_immutable
BEFORE UPDATE OR DELETE ON product_revisions
FOR EACH ROW
EXECUTE FUNCTION prevent_product_revision_mutation();--> statement-breakpoint
CREATE FUNCTION protect_asset_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF NEW.asset_identifier IS DISTINCT FROM OLD.asset_identifier
		OR NEW.asset_class_id IS DISTINCT FROM OLD.asset_class_id THEN
		RAISE EXCEPTION 'Asset identifiers and classes are immutable after allocation.';
	END IF;
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER assets_identity_immutable
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION protect_asset_identity();--> statement-breakpoint
CREATE FUNCTION prevent_asset_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'Assets cannot be deleted; retire the asset instead.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER assets_no_delete
BEFORE DELETE ON assets
FOR EACH ROW
EXECUTE FUNCTION prevent_asset_deletion();--> statement-breakpoint
CREATE FUNCTION validate_asset_product_class()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	product_asset_class_id uuid;
BEGIN
	IF NEW.product_revision_id IS NULL THEN
		RETURN NEW;
	END IF;

	SELECT product_definitions.asset_class_id
	INTO product_asset_class_id
	FROM product_revisions
	INNER JOIN product_definitions
		ON product_definitions.id = product_revisions.product_definition_id
	WHERE product_revisions.id = NEW.product_revision_id;

	IF product_asset_class_id IS NULL
		OR product_asset_class_id IS DISTINCT FROM NEW.asset_class_id THEN
		RAISE EXCEPTION 'The product revision and asset must use the same asset class.';
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER assets_product_class_consistent
BEFORE INSERT OR UPDATE OF product_revision_id ON assets
FOR EACH ROW
EXECUTE FUNCTION validate_asset_product_class();--> statement-breakpoint
WITH seeded_classes(name, identifier_prefix, identifier_padding, description) AS (
	VALUES
		('Pixel string', 'PX', 6, 'Individually tracked strings or runs of addressable pixels.'),
		('Prop or display element', 'PROP', 6, 'Display props and independently tracked visual elements.'),
		('Controller', 'CTRL', 6, 'Pixel, lighting and show controllers.'),
		('Power supply', 'PSU', 6, 'DC and auxiliary power supplies.'),
		('Enclosure', 'ENC', 6, 'Weatherproof and indoor equipment enclosures.'),
		('Cable', 'CBL', 6, 'Data, power and combined cables.'),
		('Power distribution', 'PDB', 6, 'Power distribution boards and assemblies.'),
		('Receiver', 'RCV', 6, 'Differential and remote receiver devices.'),
		('Network device', 'NET', 6, 'Switches, access points and other network equipment.'),
		('DMX fixture', 'DMX', 6, 'DMX-controlled lighting fixtures.'),
		('Structural component', 'STRUCT', 6, 'Frames, poles, mounts and structural parts.'),
		('Sensor', 'SNS', 6, 'Environmental, electrical and operational sensors.'),
		('Projector', 'PROJ', 6, 'Projection equipment and individually tracked accessories.')
),
inserted_classes AS (
	INSERT INTO asset_classes (
		name,
		identifier_prefix,
		identifier_padding,
		description
	)
	SELECT
		name,
		identifier_prefix,
		identifier_padding,
		description
	FROM seeded_classes
	RETURNING id
)
INSERT INTO asset_identifier_sequences (asset_class_id)
SELECT id
FROM inserted_classes;
