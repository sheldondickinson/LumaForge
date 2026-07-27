"use client";

import { useActionState } from "react";
import { assignComponentAction } from "@/app/(authenticated)/elements/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { AssetOption } from "@/lib/assemblies/service";

export function ComponentAssignmentForm({
  elementId,
  positionId,
  assets,
}: {
  elementId: string;
  positionId: string;
  assets: AssetOption[];
}) {
  const boundAction = assignComponentAction.bind(null, elementId, positionId);
  const [state, action, pending] = useActionState(
    boundAction,
    initialFormActionState,
  );
  return (
    <form
      action={action}
      className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
    >
      {state.message ? (
        <p role="alert" className="text-sm text-red-700 sm:col-span-3">
          {state.message}
        </p>
      ) : null}
      <select
        name="componentAssetId"
        required
        defaultValue=""
        className="min-h-11 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      >
        <option value="" disabled>
          Select component
        </option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.assetIdentifier} · {asset.friendlyName}
          </option>
        ))}
      </select>
      <input
        name="notes"
        maxLength={1000}
        placeholder="Assignment or replacement reason"
        className="min-h-11 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      />
      <button
        disabled={pending}
        className="min-h-11 rounded-lg border px-4 text-sm font-semibold hover:bg-[var(--surface-muted)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Assign"}
      </button>
    </form>
  );
}
