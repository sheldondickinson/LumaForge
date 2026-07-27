"use client";

import { useActionState } from "react";
import { createStocktakeAction } from "@/app/(authenticated)/stocktakes/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { LocationSummary } from "@/lib/locations/service";

export function StocktakeForm({ locations }: { locations: LocationSummary[] }) {
  const [state, action, isPending] = useActionState(
    createStocktakeAction,
    initialFormActionState,
  );

  return (
    <form action={action} className="space-y-6">
      {state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.message}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium">Location scope</span>
        <select
          name="locationId"
          required
          defaultValue=""
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        >
          <option value="" disabled>
            Select a location
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {"—".repeat(location.depth)} {location.code} · {location.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Assets in child locations are included automatically.
        </p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Stocktake name</span>
        <input
          name="name"
          required
          maxLength={160}
          placeholder="2026 post-season shed count"
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={isPending || locations.length === 0}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {isPending ? "Starting stocktake…" : "Start stocktake"}
      </button>
    </form>
  );
}
