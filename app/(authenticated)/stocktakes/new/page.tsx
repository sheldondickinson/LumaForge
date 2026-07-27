import Link from "next/link";
import { StocktakeForm } from "@/components/stocktake-form";
import { listLocations } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

export default async function NewStocktakePage() {
  const locations = await listLocations();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href="/stocktakes"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Stocktakes
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Start stocktake
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          The selected location includes every nested child location.
        </p>
      </header>
      <div className="rounded-xl border bg-[var(--surface)] p-5 sm:p-6">
        {locations.length ? (
          <StocktakeForm locations={locations} />
        ) : (
          <p className="text-sm">
            Create at least one location before starting a stocktake.
          </p>
        )}
      </div>
    </div>
  );
}
