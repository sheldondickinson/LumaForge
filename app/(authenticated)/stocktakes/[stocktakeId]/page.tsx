import Link from "next/link";
import { notFound } from "next/navigation";
import { completeStocktakeAction } from "@/app/(authenticated)/stocktakes/actions";
import { StocktakeScanForm } from "@/components/stocktake-scan-form";
import { formatAustralianDateTime, formatLabel } from "@/lib/format";
import { getStocktakeDetail } from "@/lib/stocktakes/service";

export const dynamic = "force-dynamic";

export default async function StocktakeDetailPage({
  params,
}: {
  params: Promise<{ stocktakeId: string }>;
}) {
  const { stocktakeId } = await params;
  const stocktake = await getStocktakeDetail(stocktakeId);
  if (!stocktake) {
    notFound();
  }
  const completeAction = completeStocktakeAction.bind(null, stocktake.id);

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/stocktakes"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Stocktakes
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {stocktake.name}
          </h1>
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-medium">
            {formatLabel(stocktake.status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {stocktake.locationCode} · {stocktake.locationName}
        </p>
      </header>

      {stocktake.status === "in_progress" ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div className="rounded-xl border bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold">Record an asset</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Scan the printed QR or enter the permanent asset ID.
            </p>
            <div className="mt-4">
              <StocktakeScanForm stocktakeId={stocktake.id} />
            </div>
          </div>
          <form
            action={completeAction}
            className="rounded-xl border bg-[var(--surface)] p-5 lg:w-72"
          >
            <h2 className="font-semibold">Finish count</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Unscanned assets expected in this location are recorded as
              missing.
            </p>
            <input type="hidden" name="confirmation" value="complete" />
            <button
              type="submit"
              className="mt-4 inline-flex min-h-11 items-center rounded-lg border px-4 font-medium"
            >
              Complete stocktake
            </button>
          </form>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Results</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {stocktake.scannedCount} scanned · {stocktake.missingCount}{" "}
              missing
            </p>
          </div>
          {stocktake.completedAt ? (
            <p className="text-sm text-slate-500">
              Completed {formatAustralianDateTime(stocktake.completedAt)}
            </p>
          ) : null}
        </div>

        {stocktake.entries.length === 0 ? (
          <p className="rounded-xl border bg-[var(--surface)] p-5 text-sm">
            No assets recorded yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold">Outcome</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Expected
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stocktake.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold">
                        {entry.assetIdentifier}
                      </span>
                      <p className="text-xs text-slate-500">
                        {entry.friendlyName}
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatLabel(entry.outcome)}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {entry.expectedLocationCode || "Unlocated"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
