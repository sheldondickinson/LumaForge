"use client";

import { useActionState } from "react";
import { createDisplayElementAction } from "@/app/(authenticated)/elements/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { AssetOption } from "@/lib/assemblies/service";

export function DisplayElementForm({ assets }: { assets: AssetOption[] }) {
  const [state, action, pending] = useActionState(
    createDisplayElementAction,
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
        <span className="text-sm font-medium">Physical prop asset</span>
        <select
          name="assetId"
          required
          defaultValue=""
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        >
          <option value="" disabled>
            Select a prop asset
          </option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.assetIdentifier} · {asset.friendlyName}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Element name</span>
        <input
          name="name"
          required
          maxLength={160}
          placeholder="Singing face"
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="description"
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border bg-[var(--surface)] p-3"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Component positions</span>
        <textarea
          name="positions"
          required
          rows={7}
          placeholder={"Outline\nEyes\nMouth A\nMouth B\nMouth C"}
          className="w-full rounded-lg border bg-[var(--surface)] p-3"
        />
        <span className="block text-xs text-slate-500">
          One named physical position per line. Position codes are assigned in
          order.
        </span>
      </label>
      <button
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create display element"}
      </button>
    </form>
  );
}
