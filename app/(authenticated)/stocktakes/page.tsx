import Link from "next/link";
import { formatAustralianDateTime, formatLabel } from "@/lib/format";
import { listStocktakes } from "@/lib/stocktakes/service";

export const dynamic = "force-dynamic";

export default async function StocktakesPage() {
  const stocktakes = await listStocktakes();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--accent)] uppercase">
            Inventory verification
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Stocktakes</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Scan assets within a location and retain every discrepancy.
          </p>
        </div>
        <Link
          href="/stocktakes/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]"
        >
          Start stocktake
        </Link>
      </header>

      {stocktakes.length === 0 ? (
        <div className="rounded-xl border bg-[var(--surface)] p-8 text-center">
          <h2 className="text-lg font-semibold">No stocktakes yet</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Create locations, move assets into storage, then start a count.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {stocktakes.map((stocktake) => (
            <Link
              key={stocktake.id}
              href={`/stocktakes/${stocktake.id}`}
              className="rounded-xl border bg-[var(--surface)] p-5 hover:border-[var(--accent)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{stocktake.name}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {stocktake.locationCode} · {stocktake.locationName}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-medium">
                  {formatLabel(stocktake.status)}
                </span>
              </div>
              <p className="mt-4 text-sm">
                {stocktake.scannedCount} scanned · {stocktake.missingCount}{" "}
                missing
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Created {formatAustralianDateTime(stocktake.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
