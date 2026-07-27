"use client";

import { useActionState } from "react";
import { moveAssetAction } from "@/app/(authenticated)/assets/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { LocationSummary } from "@/lib/locations/service";

export function AssetMovementForm({
  assetId,
  currentLocationCode,
  locations,
}: {
  assetId: string;
  currentLocationCode: string | null;
  locations: LocationSummary[];
}) {
  const boundAction = moveAssetAction.bind(null, assetId);
  const [state, action, isPending] = useActionState(
    boundAction,
    initialFormActionState,
  );

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.message}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium">Destination</span>
        <select
          name="locationId"
          required
          defaultValue=""
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        >
          <option value="" disabled>
            Select a destination
          </option>
          {currentLocationCode ? (
            <option value="__unlocated__">Unlocated</option>
          ) : null}
          {locations.map((location) => (
            <option
              key={location.id}
              value={location.id}
              disabled={location.code === currentLocationCode}
            >
              {"—".repeat(location.depth)} {location.code} · {location.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Movement reason</span>
        <input
          name="reason"
          required
          maxLength={500}
          placeholder="Stored after display pack-down"
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {isPending ? "Recording movement…" : "Move asset"}
      </button>
    </form>
  );
}
