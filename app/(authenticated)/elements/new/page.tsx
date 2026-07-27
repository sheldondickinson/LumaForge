import Link from "next/link";
import { DisplayElementForm } from "@/components/display-element-form";
import { listAvailablePropAssets } from "@/lib/assemblies/service";

export const dynamic = "force-dynamic";

export default async function NewElementPage() {
  const assets = await listAvailablePropAssets();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link
          href="/elements"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Props and elements
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          New display element
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Attach an assembly definition to an existing physical prop asset.
        </p>
      </header>
      <section className="rounded-xl border bg-[var(--surface)] p-5">
        {assets.length ? (
          <DisplayElementForm assets={assets} />
        ) : (
          <p>
            Create an available asset in the{" "}
            <strong>Prop or display element</strong> class first.
          </p>
        )}
      </section>
    </div>
  );
}
