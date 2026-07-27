import Link from "next/link";
import { PsuForm } from "@/components/psu-form";
import { listUnspecialisedAssets } from "@/lib/controllers-power/service";

export const dynamic = "force-dynamic";

export default async function NewPsuPage() {
  const assets = await listUnspecialisedAssets("PSU");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href="/power"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Power
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Configure power supply
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Specialise an existing physical PSU asset with decimal-safe electrical
          ratings.
        </p>
      </header>
      <section className="rounded-xl border bg-[var(--surface)] p-5">
        {assets.length ? (
          <PsuForm assets={assets} />
        ) : (
          <p>
            Create an available asset in the <strong>Power supply</strong> class
            first.
          </p>
        )}
      </section>
    </div>
  );
}
