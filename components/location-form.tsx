"use client";

import { useActionState } from "react";
import { createLocationAction } from "@/app/(authenticated)/locations/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { LocationSummary } from "@/lib/locations/service";

export function LocationForm({ locations }: { locations: LocationSummary[] }) {
  const [state, action, isPending] = useActionState(
    createLocationAction,
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

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Location type</span>
          <select
            name="kind"
            required
            defaultValue="shed"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3 capitalize"
          >
            <option value="shed">Shed</option>
            <option value="rack">Rack</option>
            <option value="shelf">Shelf</option>
            <option value="tote">Tote</option>
            <option value="zone">Zone</option>
            <option value="bin">Bin</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Parent location</span>
          <select
            name="parentId"
            defaultValue=""
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          >
            <option value="">Top-level location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {"—".repeat(location.depth)} {location.code} · {location.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Permanent location code</span>
          <input
            name="code"
            required
            maxLength={32}
            placeholder="SHED-01"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3 font-mono uppercase"
          />
          <p className="text-xs text-slate-500">
            Printed labels keep this code permanently.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Friendly name</span>
          <input
            name="name"
            required
            maxLength={120}
            placeholder="Display storage shed"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
      </div>

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
        disabled={isPending}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {isPending ? "Creating location…" : "Create location"}
      </button>
    </form>
  );
}
