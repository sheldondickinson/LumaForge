"use client";

import { useActionState } from "react";
import { createProductAction } from "@/app/(authenticated)/products/actions";
import {
  initialFormActionState,
  type FormActionState,
} from "@/lib/actions/state";
import type { AssetClassOption } from "@/lib/products/service";

type ProductFormValues = {
  name?: string;
  manufacturer?: string | null;
  model?: string | null;
  description?: string | null;
  voltageV?: string | number | null;
  pixelCount?: string | number | null;
  spacingMm?: string | number | null;
  protocol?: string | null;
  connector?: string | null;
};

function FieldError({
  errors,
  name,
}: {
  errors: FormActionState["errors"];
  name: string;
}) {
  const message = errors?.[name]?.[0];
  return message ? (
    <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
  ) : null;
}

export function ProductForm({
  assetClasses,
  initialValues = {},
}: {
  assetClasses: AssetClassOption[];
  initialValues?: ProductFormValues;
}) {
  const defaultAssetClass =
    assetClasses.find((assetClass) => assetClass.identifierPrefix === "PX") ??
    assetClasses[0];
  const [state, action, isPending] = useActionState(
    createProductAction,
    initialFormActionState,
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
            defaultValue={defaultAssetClass?.id}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          >
            {assetClasses.map((assetClass) => (
              <option key={assetClass.id} value={assetClass.id}>
                {assetClass.name} ({assetClass.identifierPrefix})
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} name="assetClassId" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Product name</span>
          <input
            name="name"
            required
            defaultValue={initialValues.name ?? ""}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
            placeholder="12 V WS2811 bullet pixel string"
          />
          <FieldError errors={state.errors} name="name" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Manufacturer</span>
          <input
            name="manufacturer"
            defaultValue={initialValues.manufacturer ?? ""}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Model</span>
          <input
            name="model"
            defaultValue={initialValues.model ?? ""}
            className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
          />
        </label>
      </div>

      <fieldset className="space-y-4 rounded-xl border p-4">
        <legend className="px-2 text-sm font-semibold">
          Optional pixel specifications
        </legend>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium">Voltage (V)</span>
            <input
              name="voltageV"
              inputMode="decimal"
              defaultValue={initialValues.voltageV ?? ""}
              className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
              placeholder="12"
            />
            <FieldError errors={state.errors} name="voltageV" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Pixel count</span>
            <input
              name="pixelCount"
              type="number"
              min="1"
              defaultValue={initialValues.pixelCount ?? ""}
              className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
              placeholder="100"
            />
            <FieldError errors={state.errors} name="pixelCount" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Spacing (mm)</span>
            <input
              name="spacingMm"
              inputMode="decimal"
              defaultValue={initialValues.spacingMm ?? ""}
              className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
              placeholder="100"
            />
            <FieldError errors={state.errors} name="spacingMm" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Protocol</span>
            <input
              name="protocol"
              defaultValue={initialValues.protocol ?? ""}
              className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
              placeholder="WS2811"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Connector</span>
            <input
              name="connector"
              defaultValue={initialValues.connector ?? ""}
              className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
              placeholder="xConnect"
            />
          </label>
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={initialValues.description ?? ""}
          className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Revision summary</span>
        <input
          name="changeSummary"
          required
          defaultValue="Initial product definition"
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
        <FieldError errors={state.errors} name="changeSummary" />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {isPending ? "Creating product…" : "Create product"}
      </button>
    </form>
  );
}
