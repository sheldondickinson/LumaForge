"use client";

import { useActionState } from "react";
import { createControllerAction } from "@/app/(authenticated)/controllers/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { SpecialisationAssetOption } from "@/lib/controllers-power/service";

export function ControllerForm({
  assets,
}: {
  assets: SpecialisationAssetOption[];
}) {
  const [state, action, pending] = useActionState(
    createControllerAction,
    initialFormActionState,
  );
  return (
    <form action={action} className="space-y-5">
      {state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"
        >
          {state.message}
        </p>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium">Physical controller asset</span>
        <select
          name="assetId"
          required
          defaultValue=""
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        >
          <option value="" disabled>
            Select a controller asset
          </option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.assetIdentifier} · {asset.friendlyName}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Definition name</span>
          <input
            name="name"
            required
            maxLength={160}
            placeholder="Falcon F16V5"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Controller code</span>
          <input
            name="controllerCode"
            required
            maxLength={8}
            placeholder="A"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3 font-mono uppercase"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Manufacturer</span>
          <input
            name="manufacturer"
            maxLength={160}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Model</span>
          <input
            name="model"
            maxLength={160}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Protocol</span>
          <input
            name="protocol"
            maxLength={80}
            placeholder="E1.31 / DDP"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <div />
        <label className="space-y-2">
          <span className="text-sm font-medium">Output count</span>
          <input
            name="outputCount"
            type="number"
            min={1}
            max={128}
            defaultValue={16}
            required
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Power bank count</span>
          <input
            name="powerBankCount"
            type="number"
            min={1}
            max={32}
            defaultValue={4}
            required
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border bg-[var(--surface)] p-3"
        />
      </label>
      <button
        disabled={pending}
        className="min-h-11 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create controller"}
      </button>
    </form>
  );
}
