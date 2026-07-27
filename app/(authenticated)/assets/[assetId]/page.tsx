import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssetDetail } from "@/lib/assets/service";
import { formatAssetStatus, formatAustralianDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const asset = await getAssetDetail(assetId);

  if (!asset) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/assets"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Assets
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold tracking-tight">
            {asset.assetIdentifier}
          </h1>
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-medium">
            {formatAssetStatus(asset.status)}
          </span>
        </div>
        <p className="mt-2 text-lg font-medium">{asset.friendlyName}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold">Identity</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Asset class</dt>
              <dd className="font-medium">{asset.assetClassName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Product revision</dt>
              <dd className="font-medium">
                {asset.productName
                  ? `${asset.productName} · revision ${asset.productRevisionNumber}`
                  : "No product definition assigned"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Created</dt>
              <dd className="font-medium">
                {formatAustralianDateTime(asset.createdAt)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold">Physical record</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Specification overrides</dt>
              <dd className="font-medium">
                {Object.keys(asset.specificationOverrides).length
                  ? Object.entries(asset.specificationOverrides)
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(", ")
                  : "None"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Override reason</dt>
              <dd className="font-medium">
                {asset.overrideReason || "Not applicable"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Notes</dt>
              <dd className="font-medium">{asset.notes || "Not recorded"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Audit history</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Permanent identity and material lifecycle events are retained.
          </p>
        </div>
        <ol className="space-y-3">
          {asset.auditEvents.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">{event.action}</p>
                <time className="text-sm text-slate-500">
                  {formatAustralianDateTime(event.occurredAt)}
                </time>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Actor: {event.actorType}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
