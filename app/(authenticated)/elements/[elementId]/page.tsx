import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentAssignmentForm } from "@/components/component-assignment-form";
import {
  getDisplayElementDetail,
  listAssetOptions,
} from "@/lib/assemblies/service";
import { formatAustralianDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ElementDetailPage({
  params,
}: {
  params: Promise<{ elementId: string }>;
}) {
  const { elementId } = await params;
  const [element, assets] = await Promise.all([
    getDisplayElementDetail(elementId),
    listAssetOptions(),
  ]);
  if (!element) notFound();
  const candidates = assets.filter((asset) => asset.id !== element.assetId);
  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/elements"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Props and elements
        </Link>
        <p className="mt-3 font-mono text-sm text-slate-500">
          {element.assetIdentifier}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {element.name}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {element.description || element.friendlyName}
        </p>
      </header>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Component positions</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Assigning a replacement closes the previous assignment and preserves
            it below.
          </p>
        </div>
        {element.positions.map((position) => (
          <article
            key={position.id}
            className="rounded-xl border bg-[var(--surface)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-slate-500">
                  {position.code}
                </p>
                <h3 className="text-lg font-semibold">{position.name}</h3>
              </div>
              <p className="text-sm font-medium">
                {position.currentAssetIdentifier
                  ? `${position.currentAssetIdentifier} · ${position.currentAssetName}`
                  : "Unassigned"}
              </p>
            </div>
            <ComponentAssignmentForm
              elementId={element.id}
              positionId={position.id}
              assets={candidates}
            />
          </article>
        ))}
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Assembly history</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Effective dates and configuration revisions show every component
            replacement.
          </p>
        </div>
        {element.history.length ? (
          <ol className="space-y-3">
            {element.history.map((relationship) => (
              <li
                key={relationship.id}
                className="rounded-xl border bg-[var(--surface)] p-4 text-sm"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">
                    {relationship.positionCode} · {relationship.positionName}:{" "}
                    {relationship.targetIdentifier} · {relationship.targetName}
                  </p>
                  <span>
                    {relationship.effectiveTo ? "Previous" : "Current"} ·
                    revision {relationship.configurationRevision}
                  </span>
                </div>
                <p className="mt-2 text-slate-500">
                  From {formatAustralianDateTime(relationship.effectiveFrom)}
                  {relationship.effectiveTo
                    ? ` to ${formatAustralianDateTime(relationship.effectiveTo)}`
                    : ""}
                </p>
                {relationship.notes ? (
                  <p className="mt-2">{relationship.notes}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border bg-[var(--surface)] p-4">
            No components have been assigned.
          </p>
        )}
      </section>
    </div>
  );
}
