"use client";

import { useActionState } from "react";
import { allocatePowerAction } from "@/app/(authenticated)/power/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { PsuSummary } from "@/lib/controllers-power/service";

export function PowerAllocationForm({
  bankId,
  controllerId,
  psus,
}: {
  bankId: string;
  controllerId: string;
  psus: PsuSummary[];
}) {
  const bound = allocatePowerAction.bind(null, bankId, controllerId);
  const [state, action, pending] = useActionState(
    bound,
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
        name="psuAssetId"
        required
        defaultValue=""
        aria-label="Power supply"
        className="min-h-11 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      >
        <option value="" disabled>
          Select physical PSU
        </option>
        {psus.map((psu) => (
          <option key={psu.id} value={psu.id}>
            {psu.assetIdentifier} · {psu.definitionName}
          </option>
        ))}
      </select>
      <input
        name="reason"
        required
        maxLength={500}
        placeholder="Allocation reason"
        aria-label="Allocation reason"
        className="min-h-11 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      />
      <button
        disabled={pending}
        className="min-h-11 rounded-lg border px-4 text-sm font-semibold hover:bg-[var(--surface-muted)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Allocate"}
      </button>
    </form>
  );
}
