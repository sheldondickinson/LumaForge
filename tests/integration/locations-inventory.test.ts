import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection, createDatabaseClient } from "@/db/client";
import { createAssets } from "@/lib/assets/service";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  createLocation,
  getAssetMovements,
  listLocations,
  moveAsset,
} from "@/lib/locations/service";
import { createProduct } from "@/lib/products/service";
import {
  completeStocktake,
  createStocktake,
  getStocktakeDetail,
  scanStocktakeAsset,
} from "@/lib/stocktakes/service";

const databaseUrl = process.env.DATABASE_URL;
const hasIsolatedDatabase = Boolean(
  databaseUrl && new URL(databaseUrl).pathname.endsWith("_test"),
);

describe.skipIf(!hasIsolatedDatabase)(
  "locations and inventory integration",
  () => {
    const connection = hasIsolatedDatabase ? createDatabaseClient() : undefined;
    const user: AuthenticatedUser = {
      id: randomUUID(),
      email: `locations-${randomUUID()}@example.test`,
      role: "administrator",
    };
    let pixelClassId: string;
    let firstAssetId: string;
    let firstAssetIdentifier: string;
    let secondAssetId: string;
    let shedId: string;
    let rackId: string;
    let shelfId: string;
    let toteId: string;

    beforeAll(async () => {
      if (!connection) {
        throw new Error("An isolated *_test database is required.");
      }

      await connection.client`
      insert into users (id, email, password_hash, role)
      values (${user.id}, ${user.email}, 'integration-test-only', 'administrator')
    `;

      const [pixelClass] = await connection.client<{ id: string }[]>`
      select id
      from asset_classes
      where identifier_prefix = 'PX'
    `;
      if (!pixelClass) {
        throw new Error("The PX asset class seed is missing.");
      }
      pixelClassId = pixelClass.id;

      const product = await createProduct(
        {
          assetClassId: pixelClassId,
          name: "Inventory integration pixel string",
          voltageV: "12",
          pixelCount: 100,
          changeSummary: "Location integration fixture",
        },
        user,
      );
      const [revision] = await connection.client<{ id: string }[]>`
      select id
      from product_revisions
      where product_definition_id = ${product.id}
    `;
      if (!revision) {
        throw new Error("The product revision fixture is missing.");
      }

      const createdAssets = await createAssets(
        {
          assetClassId: pixelClassId,
          productRevisionId: revision.id,
          quantity: 2,
          friendlyNameBase: "Stocktake pixels",
          status: "available",
        },
        user,
      );
      firstAssetId = createdAssets[0]!.id;
      firstAssetIdentifier = createdAssets[0]!.assetIdentifier;
      secondAssetId = createdAssets[1]!.id;

      shedId = (
        await createLocation(
          { kind: "shed", code: "SHED-TEST", name: "Test shed" },
          user,
        )
      ).id;
      rackId = (
        await createLocation(
          {
            parentId: shedId,
            kind: "rack",
            code: "RACK-TEST",
            name: "Test rack",
          },
          user,
        )
      ).id;
      shelfId = (
        await createLocation(
          {
            parentId: rackId,
            kind: "shelf",
            code: "SHELF-TEST",
            name: "Test shelf",
          },
          user,
        )
      ).id;
      toteId = (
        await createLocation(
          {
            parentId: shelfId,
            kind: "tote",
            code: "TOTE-TEST",
            name: "Test tote",
          },
          user,
        )
      ).id;
    });

    afterAll(async () => {
      if (!connection) {
        return;
      }

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
      await connection.client`
      update asset_identifier_sequences
      set next_value = 1, updated_at = now()
    `;
      await connection.client`
      delete from audit_events where actor_id = ${user.id}
    `;
      await connection.client`
      delete from users where id = ${user.id}
    `;
      await connection.client.end();
      await closeDatabaseConnection();
    });

    it("builds a cycle-safe shed, rack, shelf and tote hierarchy", async () => {
      if (!connection) {
        throw new Error("Database connection is unavailable.");
      }

      const locations = await listLocations();
      expect(locations.find((location) => location.id === toteId)?.path).toBe(
        "Test shed / Test rack / Test shelf / Test tote",
      );

      await expect(
        connection.client`
        update locations
        set parent_id = ${toteId}
        where id = ${shedId}
      `,
      ).rejects.toThrow(/cannot be placed inside/i);

      await expect(
        connection.client`
        update locations
        set code = 'SHED-REWRITTEN'
        where id = ${shedId}
      `,
      ).rejects.toThrow(/permanent/i);
    });

    it("moves assets without overwriting historical assignments", async () => {
      if (!connection) {
        throw new Error("Database connection is unavailable.");
      }

      await moveAsset(
        firstAssetId,
        { locationId: shelfId, reason: "Initial shelf placement" },
        user,
      );
      await moveAsset(
        firstAssetId,
        { locationId: toteId, reason: "Packed into tote" },
        user,
      );
      await moveAsset(
        secondAssetId,
        { locationId: toteId, reason: "Packed into tote" },
        user,
      );

      const movements = await getAssetMovements(firstAssetId);
      expect(movements).toHaveLength(2);
      expect(movements[0]?.locationCode).toBe("TOTE-TEST");
      expect(movements[0]?.endedAt).toBeNull();
      expect(movements[1]?.locationCode).toBe("SHELF-TEST");
      expect(movements[1]?.endedAt).not.toBeNull();

      await expect(
        connection.client`
        update asset_location_assignments
        set reason = 'Rewritten history'
        where id = ${movements[1]!.id}
      `,
      ).rejects.toThrow(/immutable/i);
    });

    it("records scans and closes unscanned expected assets as missing", async () => {
      const stocktake = await createStocktake(
        {
          locationId: shedId,
          name: "Integration shed stocktake",
        },
        user,
      );

      await scanStocktakeAsset(
        stocktake.id,
        { assetIdentifier: firstAssetIdentifier },
        user,
      );
      await expect(
        scanStocktakeAsset(
          stocktake.id,
          { assetIdentifier: firstAssetIdentifier },
          user,
        ),
      ).rejects.toThrow(/already been scanned/i);

      const completion = await completeStocktake(stocktake.id, user);
      expect(completion.missingCount).toBe(1);

      const detail = await getStocktakeDetail(stocktake.id);
      expect(detail?.status).toBe("completed");
      expect(detail?.entries.map((entry) => entry.outcome).sort()).toEqual([
        "confirmed",
        "missing",
      ]);
    });
  },
);
