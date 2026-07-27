"use client";

import { useActionState } from "react";
import { createAssetRelationshipAction } from "@/app/(authenticated)/assets/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { AssetOption } from "@/lib/assemblies/service";

export function AssetRelationshipForm({
  assetId,
  assets,
}: {
  assetId: string;
  assets: AssetOption[];
}) {
  const boundAction = createAssetRelationshipAction.bind(null, assetId);
  const [state, action, pending] = useActionState(
    boundAction,
    initialFormActionState,
  );
  return (
    <form action={action} className="space-y-3">
      {state.message ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      <select
        name="relationshipType"
        required
        defaultValue="contains"
        className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
      >
        <option value="contains">Contains</option>
        <option value="mounted_on">Mounted on</option>
        <option value="connected_to">Connected to</option>
      </select>
      <select
        name="targetAssetId"
        required
        defaultValue=""
        className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
      >
        <option value="" disabled>
          Select related asset
        </option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.assetIdentifier} · {asset.friendlyName}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="sourceConnector"
          maxLength={100}
          placeholder="Source connector (optional)"
          className="min-h-11 rounded-lg border bg-[var(--surface)] px-3"
        />
        <input
          name="targetConnector"
          maxLength={100}
          placeholder="Target connector (optional)"
          className="min-h-11 rounded-lg border bg-[var(--surface)] px-3"
        />
      </div>
      <input
        name="notes"
        maxLength={1000}
        placeholder="Relationship notes (optional)"
        className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
      />
      <button
        disabled={pending}
        className="min-h-11 rounded-lg border px-4 font-semibold hover:bg-[var(--surface-muted)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add relationship"}
      </button>
    </form>
  );
}
