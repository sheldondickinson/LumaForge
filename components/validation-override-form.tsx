"use client";

import { useActionState } from "react";
import { overrideValidationResultAction } from "@/app/(authenticated)/controllers/actions";
import { initialFormActionState } from "@/lib/actions/state";

export function ValidationOverrideForm({
  controllerId,
  resultId,
}: {
  controllerId: string;
  resultId: string;
}) {
  const bound = overrideValidationResultAction.bind(
    null,
    controllerId,
    resultId,
  );
  const [state, action, pending] = useActionState(
    bound,
    initialFormActionState,
  );
  return (
    <form action={action} className="mt-3 flex flex-wrap gap-3">
      {state.message ? (
        <p role="alert" className="w-full text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      <input
        name="reason"
        required
        minLength={5}
        maxLength={1000}
        placeholder="Document why this result is acceptable"
        aria-label="Override reason"
        className="min-h-11 min-w-64 flex-1 rounded-lg border bg-[var(--surface)] px-3 text-sm"
      />
      <button
        disabled={pending}
        className="min-h-11 rounded-lg border px-4 text-sm font-semibold hover:bg-[var(--surface-muted)] disabled:opacity-60"
      >
        {pending ? "Recording…" : "Record override"}
      </button>
    </form>
  );
}
