"use client";

import { useActionState, useMemo, useState } from "react";
import { createAssetsAction } from "@/app/(authenticated)/assets/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { AssetClassOption } from "@/lib/products/service";

type ProductRevisionOption = {
  revisionId: string;
  assetClassId: string;
  assetClassPrefix: string;
  name: string;
  revisionNumber: number;
};

export function AssetForm({
  assetClasses,
  productRevisions,
}: {
  assetClasses: AssetClassOption[];
  productRevisions: ProductRevisionOption[];
}) {
  const pixelClass =
    assetClasses.find((assetClass) => assetClass.identifierPrefix === "PX") ??
    assetClasses[0];
  const [assetClassId, setAssetClassId] = useState(pixelClass?.id ?? "");
  const [state, action, isPending] = useActionState(
    createAssetsAction,
    initialFormActionState,
  );
  const matchingProducts = useMemo(
    () =>
      productRevisions.filter(
        (revision) => revision.assetClassId === assetClassId,
      ),
    [assetClassId, productRevisions],
  );

  return (
    <form action={action} className="space-y-6">
      {state.message ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Asset class</span>
          <select
            name="assetClassId"
            required
            value={assetClassId}
            onChange={(event) => setAssetClassId(event.target.value)}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          >
            {assetClasses.map((assetClass) => (
              <option key={assetClass.id} value={assetClass.id}>
                {assetClass.name} ({assetClass.identifierPrefix})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Product revision</span>
          <select
            name="productRevisionId"
            defaultValue=""
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          >
            <option value="">No product definition</option>
            {matchingProducts.map((revision) => (
              <option key={revision.revisionId} value={revision.revisionId}>
                {revision.name} — revision {revision.revisionNumber}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Quantity</span>
          <input
            name="quantity"
            type="number"
            min="1"
            max="100"
            required
            defaultValue="1"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
          <p className="text-xs text-slate-500">
            Each physical item receives its own permanent identifier.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Friendly name base</span>
          <input
            name="friendlyNameBase"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
            placeholder="Front fence pixels"
          />
          <p className="text-xs text-slate-500">
            Multiple assets receive numbered names automatically.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Initial status</span>
          <select
            name="status"
            defaultValue="available"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          >
            <option value="available">Available</option>
            <option value="in_use">In use</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">
            Actual pixel count override
          </span>
          <input
            name="actualPixelCount"
            type="number"
            min="1"
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Override reason</span>
        <input
          name="overrideReason"
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          placeholder="Required when a physical specification differs"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {isPending ? "Allocating identifiers…" : "Create assets"}
      </button>
    </form>
  );
}
