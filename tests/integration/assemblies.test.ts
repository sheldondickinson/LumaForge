import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection, createDatabaseClient } from "@/db/client";
import {
  assignComponent,
  createAssetRelationship,
  createDisplayElement,
  getDisplayElementDetail,
} from "@/lib/assemblies/service";
import type { AuthenticatedUser } from "@/lib/auth/service";

const databaseUrl = process.env.DATABASE_URL;
const hasIsolatedDatabase = Boolean(
  databaseUrl && new URL(databaseUrl).pathname.endsWith("_test"),
);

describe.skipIf(!hasIsolatedDatabase)("assemblies integration", () => {
  const connection = hasIsolatedDatabase ? createDatabaseClient() : undefined;
  const user: AuthenticatedUser = {
    id: randomUUID(),
    email: `assemblies-${randomUUID()}@example.test`,
    role: "administrator",
  };
  let propId: string;
  let firstComponentId: string;
  let secondComponentId: string;
  let elementId: string;

  beforeAll(async () => {
    if (!connection)
      throw new Error("An isolated *_test database is required.");
    await connection.client`
      insert into users (id, email, password_hash, role)
      values (${user.id}, ${user.email}, 'integration-test-only', 'administrator')
    `;
    const [propClass] = await connection.client<{ id: string }[]>`
      select id from asset_classes where identifier_prefix = 'PROP'
    `;
    const [pixelClass] = await connection.client<{ id: string }[]>`
      select id from asset_classes where identifier_prefix = 'PX'
    `;
    if (!propClass || !pixelClass)
      throw new Error("Asset class seeds are missing.");
    [propId, firstComponentId, secondComponentId] = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ];
    await connection.client`
      insert into assets (
        id, asset_class_id, asset_identifier, friendly_name, created_by, updated_by
      )
      values
        (${propId}, ${propClass.id}, ${`PROP-${Date.now()}`}, 'Integration singing face', ${user.id}, ${user.id}),
        (${firstComponentId}, ${pixelClass.id}, ${`PX-${Date.now()}`}, 'First physical string', ${user.id}, ${user.id}),
        (${secondComponentId}, ${pixelClass.id}, ${`PX-${Date.now() + 1}`}, 'Replacement physical string', ${user.id}, ${user.id})
    `;
    elementId = (
      await createDisplayElement(
        {
          assetId: propId,
          name: "Singing face",
          positions: "Outline\nEyes\nMouth A\nMouth B\nMouth C",
        },
        user,
      )
    ).id;
  });

  afterAll(async () => {
    if (!connection) return;
    await connection.client`
      truncate table
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

  it("creates five explicit positions and preserves replacement history", async () => {
    const initial = await getDisplayElementDetail(elementId);
    expect(initial?.positions).toHaveLength(5);
    const positionId = initial!.positions[0]!.id;

    await assignComponent(
      positionId,
      { componentAssetId: firstComponentId, notes: "Initial build" },
      user,
    );
    await assignComponent(
      positionId,
      { componentAssetId: secondComponentId, notes: "Failed string replaced" },
      user,
    );

    const updated = await getDisplayElementDetail(elementId);
    expect(updated?.positions[0]?.currentAssetId).toBe(secondComponentId);
    expect(updated?.history).toHaveLength(2);
    expect(updated?.history[0]?.configurationRevision).toBe(2);
    expect(updated?.history[1]?.effectiveTo).not.toBeNull();
  });

  it("rejects circular assembly relationships", async () => {
    await createAssetRelationship(
      propId,
      { relationshipType: "contains", targetAssetId: firstComponentId },
      user,
    );
    await expect(
      createAssetRelationship(
        firstComponentId,
        { relationshipType: "contains", targetAssetId: propId },
        user,
      ),
    ).rejects.toThrow(/circular assembly/i);
  });
});
