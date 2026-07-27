import Link from "next/link";
import { ControllerForm } from "@/components/controller-form";
import { listUnspecialisedAssets } from "@/lib/controllers-power/service";

export const dynamic = "force-dynamic";

export default async function NewControllerPage() {
  const assets = await listUnspecialisedAssets("CTRL");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href="/controllers"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Controllers
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Configure controller
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Specialise an existing physical controller asset and create its
          outputs and power banks.
        </p>
      </header>
      <section className="rounded-xl border bg-[var(--surface)] p-5">
        {assets.length ? (
          <ControllerForm assets={assets} />
        ) : (
          <p>
            Create an available asset in the <strong>Controller</strong> class
            first.
          </p>
        )}
      </section>
    </div>
  );
}
