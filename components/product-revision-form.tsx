"use client";

import { useActionState } from "react";
import { createProductRevisionAction } from "@/app/(authenticated)/products/actions";
import { initialFormActionState } from "@/lib/actions/state";
import type { ProductDetail } from "@/lib/products/service";

function value(specifications: ProductDetail["specifications"], key: string) {
  const result = specifications[key];
  return typeof result === "string" || typeof result === "number" ? result : "";
}

export function ProductRevisionForm({ product }: { product: ProductDetail }) {
  const [state, action, isPending] = useActionState(
    createProductRevisionAction.bind(null, product.id),
    initialFormActionState,
  );

  return (
    <form action={action} className="space-y-5 rounded-xl border p-5">
      <div>
        <h2 className="text-xl font-semibold">Create revision</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          The current revision remains immutable and visible in history.
        </p>
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Product name</span>
          <input
            name="name"
            required
            defaultValue={product.name}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Manufacturer</span>
          <input
            name="manufacturer"
            defaultValue={product.manufacturer ?? ""}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Model</span>
          <input
            name="model"
            defaultValue={product.model ?? ""}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Voltage (V)</span>
          <input
            name="voltageV"
            inputMode="decimal"
            defaultValue={value(product.specifications, "voltageV")}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Pixel count</span>
          <input
            name="pixelCount"
            type="number"
            min="1"
            defaultValue={value(product.specifications, "pixelCount")}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Spacing (mm)</span>
          <input
            name="spacingMm"
            inputMode="decimal"
            defaultValue={value(product.specifications, "spacingMm")}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Protocol</span>
          <input
            name="protocol"
            defaultValue={value(product.specifications, "protocol")}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Connector</span>
          <input
            name="connector"
            defaultValue={value(product.specifications, "connector")}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={product.description ?? ""}
          className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">What changed?</span>
        <input
          name="changeSummary"
          required
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {isPending ? "Saving revision…" : "Create revision"}
      </button>
    </form>
  );
}
