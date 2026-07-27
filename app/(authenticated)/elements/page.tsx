import Link from "next/link";
import { listDisplayElements } from "@/lib/assemblies/service";

export const dynamic = "force-dynamic";

export default async function ElementsPage() {
  const elements = await listDisplayElements();
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            Assemblies
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Props and elements
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Define physical component positions and retain every assignment
            revision.
          </p>
        </div>
        <Link
          href="/elements/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]"
        >
          New display element
        </Link>
      </header>
      {elements.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {elements.map((element) => (
            <Link
              key={element.id}
              href={`/elements/${element.id}`}
              className="rounded-xl border bg-[var(--surface)] p-5 hover:border-[var(--accent)]"
            >
              <p className="font-mono text-sm text-slate-500">
                {element.assetIdentifier}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{element.name}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {element.friendlyName}
              </p>
              <p className="mt-4 text-sm font-medium">
                {element.assignedCount} of {element.positionCount} positions
                assigned
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border bg-[var(--surface)] p-5">
          No display elements have been defined.
        </p>
      )}
    </div>
  );
}
