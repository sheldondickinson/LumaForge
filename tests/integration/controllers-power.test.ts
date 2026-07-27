import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection, createDatabaseClient } from "@/db/client";
import {
  assignComponent,
  createDisplayElement,
} from "@/lib/assemblies/service";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  allocatePower,
  assignOutput,
  createController,
  createPsu,
  getControllerDetail,
} from "@/lib/controllers-power/service";
import {
  getLatestValidationRun,
  overrideValidationResult,
  runControllerValidation,
} from "@/lib/validations/service";

const databaseUrl = process.env.DATABASE_URL;
const hasIsolatedDatabase = Boolean(
  databaseUrl && new URL(databaseUrl).pathname.endsWith("_test"),
);

describe.skipIf(!hasIsolatedDatabase)(
  "controllers and power integration",
  () => {
    const connection = hasIsolatedDatabase ? createDatabaseClient() : undefined;
    const user: AuthenticatedUser = {
      id: randomUUID(),
      email: `controllers-${randomUUID()}@example.test`,
      role: "administrator",
    };
    let controllerAssetId: string;
    let psuAssetId: string;
    let propAssetId: string;
    let componentAssetId: string;
    let controllerId: string;
    let psuId: string;
    let positionId: string;
    let originalControllerIdentifier: string;

    beforeAll(async () => {
      if (!connection)
        throw new Error("An isolated *_test database is required.");
      await connection.client`
      insert into users (id, email, password_hash, role)
      values (${user.id}, ${user.email}, 'integration-test-only', 'administrator')
    `;
      const classes = await connection.client<
        Array<{ id: string; prefix: string }>
      >`
      select id, identifier_prefix as prefix
      from asset_classes
      where identifier_prefix in ('CTRL', 'PSU', 'PROP')
    `;
      const classId = (prefix: string) =>
        classes.find((item) => item.prefix === prefix)?.id;
      if (!classId("CTRL") || !classId("PSU") || !classId("PROP")) {
        throw new Error("Controller, PSU or prop asset class seed is missing.");
      }
      controllerAssetId = randomUUID();
      psuAssetId = randomUUID();
      propAssetId = randomUUID();
      componentAssetId = randomUUID();
      originalControllerIdentifier = `CTRL-${Date.now()}`;
      await connection.client`
      insert into assets (
        id, asset_class_id, asset_identifier, friendly_name, created_by, updated_by
      )
      values
        (${controllerAssetId}, ${classId("CTRL")!}, ${originalControllerIdentifier}, 'Integration controller', ${user.id}, ${user.id}),
        (${psuAssetId}, ${classId("PSU")!}, ${`PSU-${Date.now()}`}, 'Integration PSU', ${user.id}, ${user.id}),
        (${propAssetId}, ${classId("PROP")!}, ${`PROP-${Date.now()}`}, 'Integration prop', ${user.id}, ${user.id}),
        (${componentAssetId}, ${classId("PROP")!}, ${`COMP-${Date.now()}`}, 'Integration component', ${user.id}, ${user.id})
    `;
      const element = await createDisplayElement(
        {
          assetId: propAssetId,
          name: "Controller test prop",
          positions: "String 1\nString 2",
        },
        user,
      );
      const [position] = await connection.client<{ id: string }[]>`
      select id from component_positions
      where display_element_id = ${element.id} and sequence = 2
    `;
      positionId = position!.id;
      await assignComponent(
        positionId,
        {
          componentAssetId,
          notes: "Install integration component",
        },
        user,
      );
      controllerId = (
        await createController(
          {
            assetId: controllerAssetId,
            name: "Integration 16-port controller",
            controllerCode: "A",
            outputCount: 4,
            powerBankCount: 2,
          },
          user,
        )
      ).id;
      psuId = (
        await createPsu(
          {
            assetId: psuAssetId,
            name: "Integration 12 V PSU",
            outputVoltageV: "12",
            maximumCurrentA: "29.167",
            maximumPowerW: "350",
          },
          user,
        )
      ).id;
    });

    afterAll(async () => {
      if (!connection) return;
      await connection.client`
      truncate table
        validation_overrides,
        validation_results,
        validation_runs,
        power_allocations,
        output_assignments,
        controller_outputs,
        power_banks,
        psu_assets,
        psu_definitions,
        controller_assets,
        controller_definitions,
        asset_relationships,
        component_positions,
        display_elements,
        stocktake_entries,
        stocktakes,
        asset_location_assignments,
        locations,
        assets,
        product_revisions,
        product_definitions
    `;
      await connection.client`delete from audit_events where actor_id = ${user.id}`;
      await connection.client`delete from users where id = ${user.id}`;
      await connection.client.end();
      await closeDatabaseConnection();
    });

    it("generates a structured logical identifier and preserves reassignment history", async () => {
      if (!connection) throw new Error("Database connection is unavailable.");
      const outputs = await connection.client<
        Array<{ id: string; outputNumber: number }>
      >`
      select id, output_number as "outputNumber"
      from controller_outputs where controller_asset_id = ${controllerId}
      order by output_number
    `;
      const first = await assignOutput(
        outputs[2]!.id,
        {
          componentPositionId: positionId,
          propNumber: 22,
          stringNumber: 2,
          reason: "Initial deployment",
        },
        user,
      );
      expect(first.logicalIdentifier).toBe("A-O03-P022-S02");

      const replacement = await assignOutput(
        outputs[3]!.id,
        {
          componentPositionId: positionId,
          propNumber: 22,
          stringNumber: 2,
          reason: "Moved to output 4",
        },
        user,
      );
      expect(replacement.logicalIdentifier).toBe("A-O04-P022-S02");

      const detail = await getControllerDetail(controllerId);
      expect(detail?.assignmentHistory).toHaveLength(2);
      expect(detail?.assignmentHistory[1]?.effectiveTo).not.toBeNull();
      const [asset] = await connection.client<{ assetIdentifier: string }[]>`
      select asset_identifier as "assetIdentifier"
      from assets where id = ${controllerAssetId}
    `;
      expect(asset?.assetIdentifier).toBe(originalControllerIdentifier);
    });

    it("allocates a physical PSU to a controller power bank", async () => {
      if (!connection) throw new Error("Database connection is unavailable.");
      const [bank] = await connection.client<{ id: string }[]>`
      select id from power_banks
      where controller_asset_id = ${controllerId} and bank_number = 1
    `;
      await allocatePower(
        bank!.id,
        { psuAssetId: psuId, reason: "Initial bank supply" },
        user,
      );
      const detail = await getControllerDetail(controllerId);
      expect(detail?.banks[0]?.psuIdentifier).toMatch(/^PSU-/);
    });

    it("persists validation evidence and documented overrides", async () => {
      await runControllerValidation(controllerId, user);
      const run = await getLatestValidationRun(controllerId);
      expect(run?.results.length).toBeGreaterThan(0);
      const overridable = run?.results.find((result) => result.overrideAllowed);
      expect(overridable).toBeDefined();
      await overrideValidationResult(
        overridable!.id,
        { reason: "Accepted for controlled integration testing" },
        user,
      );
      const updated = await getLatestValidationRun(controllerId);
      expect(
        updated?.results.find((result) => result.id === overridable!.id)
          ?.overrideReason,
      ).toBe("Accepted for controlled integration testing");
    });
  },
);
