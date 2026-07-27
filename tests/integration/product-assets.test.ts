import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection, createDatabaseClient } from "@/db/client";
import { createAssets, getAssetDetail } from "@/lib/assets/service";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  createProduct,
  createProductRevision,
  getProductDetail,
} from "@/lib/products/service";

const databaseUrl = process.env.DATABASE_URL;
const hasIsolatedDatabase = Boolean(
  databaseUrl && new URL(databaseUrl).pathname.endsWith("_test"),
);

describe.skipIf(!hasIsolatedDatabase)("product and asset integration", () => {
  const connection = hasIsolatedDatabase ? createDatabaseClient() : undefined;
  const user: AuthenticatedUser = {
    id: randomUUID(),
    email: `product-assets-${randomUUID()}@example.test`,
    role: "administrator",
  };
  let pixelClassId: string;

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

  it("keeps historical product revisions visible and immutable", async () => {
    if (!connection) {
      throw new Error("Database connection is unavailable.");
    }

    const product = await createProduct(
      {
        assetClassId: pixelClassId,
        name: "12 V WS2811 bullet pixel string",
        manufacturer: "Integration Test Pixels",
        model: "ITP-100",
        voltageV: "12",
        pixelCount: 100,
        spacingMm: "100",
        protocol: "WS2811",
        connector: "xConnect",
        changeSummary: "Initial product definition",
      },
      user,
    );

    await createProductRevision(
      product.id,
      {
        name: "12 V WS2811 bullet pixel string",
        manufacturer: "Integration Test Pixels",
        model: "ITP-100",
        voltageV: "12",
        pixelCount: 100,
        spacingMm: "75",
        protocol: "WS2811",
        connector: "xConnect",
        changeSummary: "Corrected nominal pixel spacing",
      },
      user,
    );

    const detail = await getProductDetail(product.id);
    expect(
      detail?.revisions.map((revision) => revision.revisionNumber),
    ).toEqual([2, 1]);
    expect(detail?.revisions[1]?.specifications.spacingMm).toBe("100");
    expect(detail?.revisions[0]?.specifications.spacingMm).toBe("75");

    await expect(
      connection.client`
        update product_revisions
        set name = 'Silently rewritten'
        where product_definition_id = ${product.id}
          and revision_number = 1
      `,
    ).rejects.toThrow(/immutable/i);
  });

  it("allocates unique permanent asset identifiers concurrently", async () => {
    if (!connection) {
      throw new Error("Database connection is unavailable.");
    }

    const [productRevision] = await connection.client<{ id: string }[]>`
      select id
      from product_revisions
      order by revision_number desc
      limit 1
    `;
    if (!productRevision) {
      throw new Error("The product revision fixture is missing.");
    }

    const batches = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        createAssets(
          {
            assetClassId: pixelClassId,
            productRevisionId: productRevision.id,
            quantity: 1,
            friendlyNameBase: `Integration pixel string ${index + 1}`,
            status: "available",
          },
          user,
        ),
      ),
    );
    const created = batches.flat();
    const identifiers = created.map((asset) => asset.assetIdentifier);

    expect(new Set(identifiers).size).toBe(10);
    expect(
      identifiers.every((identifier) => /^PX-\d{6}$/.test(identifier)),
    ).toBe(true);

    const detail = await getAssetDetail(created[0]!.id);
    expect(detail?.auditEvents.map((event) => event.action)).toContain(
      "asset.created",
    );

    await expect(
      connection.client`
        update assets
        set asset_identifier = 'PX-999999'
        where id = ${created[0]!.id}
      `,
    ).rejects.toThrow(/immutable/i);
  });
});
