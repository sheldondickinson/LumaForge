"use client";

import { useActionState } from "react";
import { createPsuAction } from "@/app/(authenticated)/power/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { SpecialisationAssetOption } from "@/lib/controllers-power/service";

export function PsuForm({ assets }: { assets: SpecialisationAssetOption[] }) {
  const [state, action, pending] = useActionState(
    createPsuAction,
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
        <span className="text-sm font-medium">Physical PSU asset</span>
        <select
          name="assetId"
          required
          defaultValue=""
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        >
          <option value="" disabled>
            Select a power supply asset
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
            placeholder="12 V 350 W PSU"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
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
        <div />
        <label className="space-y-2">
          <span className="text-sm font-medium">Output voltage (V)</span>
          <input
            name="outputVoltageV"
            required
            inputMode="decimal"
            placeholder="12"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Maximum current (A)</span>
          <input
            name="maximumCurrentA"
            required
            inputMode="decimal"
            placeholder="29.167"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Maximum power (W)</span>
          <input
            name="maximumPowerW"
            required
            inputMode="decimal"
            placeholder="350"
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
        {pending ? "Saving…" : "Configure power supply"}
      </button>
    </form>
  );
}
