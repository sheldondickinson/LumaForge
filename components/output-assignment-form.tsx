"use client";

import { useActionState } from "react";
import { assignOutputAction } from "@/app/(authenticated)/controllers/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { PositionOption } from "@/lib/controllers-power/service";

export function OutputAssignmentForm({
  controllerId,
  outputId,
  positions,
}: {
  controllerId: string;
  outputId: string;
  positions: PositionOption[];
}) {
  const bound = assignOutputAction.bind(null, controllerId, outputId);
  const [state, action, pending] = useActionState(
    bound,
    initialFormActionState,
  );
  return (
    <form
      action={action}
      className="mt-3 grid gap-3 md:grid-cols-[minmax(12rem,1fr)_6rem_6rem_minmax(10rem,1fr)_auto]"
    >
      {state.message ? (
        <p role="alert" className="text-sm text-red-700 md:col-span-5">
          {state.message}
        </p>
      ) : null}
      <select
        name="componentPositionId"
        required
        defaultValue=""
        aria-label="Display element position"
        className="min-h-11 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      >
        <option value="" disabled>
          Select element position
        </option>
        {positions.map((position) => (
          <option key={position.id} value={position.id}>
            {position.elementName} · {position.positionCode}{" "}
            {position.positionName}
          </option>
        ))}
      </select>
      <input
        name="propNumber"
        type="number"
        min={1}
        max={999}
        required
        placeholder="Prop"
        aria-label="Prop number"
        className="min-h-11 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      />
      <input
        name="stringNumber"
        type="number"
        min={1}
        max={99}
        required
        placeholder="String"
        aria-label="String number"
        className="min-h-11 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      />
      <input
        name="reason"
        required
        maxLength={500}
        placeholder="Assignment reason"
        aria-label="Assignment reason"
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
