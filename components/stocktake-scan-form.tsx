"use client";

import { useActionState } from "react";
import { scanStocktakeAssetAction } from "@/app/(authenticated)/stocktakes/actions";
import { initialFormActionState } from "@/lib/actions/state";

export function StocktakeScanForm({ stocktakeId }: { stocktakeId: string }) {
  const boundAction = scanStocktakeAssetAction.bind(null, stocktakeId);
  const [state, action, isPending] = useActionState(
    boundAction,
    initialFormActionState,
  );
  const isError = Boolean(state.errors);

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <p
          role={isError ? "alert" : "status"}
          className={
            isError
              ? "rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
              : "rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          }
        >
          {state.message}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium">Asset ID</span>
        <input
          name="assetIdentifier"
          required
          autoFocus
          autoComplete="off"
          placeholder="Scan QR or enter PX-000184"
          className="min-h-12 w-full rounded-lg border bg-[var(--surface)] px-3 font-mono text-lg uppercase"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Scan note</span>
        <input
          name="notes"
          maxLength={500}
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {isPending ? "Recording…" : "Record asset"}
      </button>
    </form>
  );
}
