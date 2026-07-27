import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetMovementForm } from "@/components/asset-movement-form";
import { AssetRelationshipForm } from "@/components/asset-relationship-form";
import {
  getAssetRelationships,
  listAssetOptions,
} from "@/lib/assemblies/service";
import { getAssetDetail } from "@/lib/assets/service";
import { formatAssetStatus, formatAustralianDateTime } from "@/lib/format";
import { getAssetMovements, listLocations } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const [asset, locations, movements, relationships, assetOptions] =
    await Promise.all([
      getAssetDetail(assetId),
      listLocations(),
      getAssetMovements(assetId),
      getAssetRelationships(assetId),
      listAssetOptions(),
    ]);

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
        <div className="mt-4">
          <Link
            href={`/assets/${asset.id}/label`}
            className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-[var(--surface-muted)]"
          >
            Print QR and Code 128 label
          </Link>
        </div>
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
              <dt className="text-slate-500">Current location</dt>
              <dd className="font-medium">
                {asset.locationCode
                  ? `${asset.locationCode} · ${asset.locationName}`
                  : "Unlocated"}
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

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Movement history</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Previous assignments are closed and retained; they are never
              overwritten.
            </p>
          </div>
          {movements.length ? (
            <ol className="space-y-3">
              {movements.map((movement) => (
                <li
                  key={movement.id}
                  className="rounded-xl border bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">
                      {movement.locationCode
                        ? `${movement.locationCode} · ${movement.locationName}`
                        : "Unlocated"}
                    </p>
                    <span className="text-sm text-slate-500">
                      {movement.endedAt ? "Previous" : "Current"}
                    </span>
                  </div>
                  {movement.locationPath ? (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {movement.locationPath}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm">{movement.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    From {formatAustralianDateTime(movement.startedAt)}
                    {movement.endedAt
                      ? ` to ${formatAustralianDateTime(movement.endedAt)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl border bg-[var(--surface)] p-4 text-sm">
              No location has been assigned.
            </p>
          )}
        </div>

        <aside className="rounded-xl border bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold">Move asset</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Record the physical destination and reason.
          </p>
          <div className="mt-4">
            {locations.length ? (
              <AssetMovementForm
                assetId={asset.id}
                currentLocationCode={asset.locationCode}
                locations={locations}
              />
            ) : (
              <p className="text-sm">
                <Link
                  href="/locations/new"
                  className="text-[var(--accent)] hover:underline"
                >
                  Create a location
                </Link>{" "}
                before moving this asset.
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Asset relationships</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Typed, effective-dated physical relationships remain separate from
              permanent identity.
            </p>
          </div>
          {relationships.length ? (
            <ol className="space-y-3">
              {relationships.map((relationship) => (
                <li
                  key={relationship.id}
                  className="rounded-xl border bg-[var(--surface)] p-4 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">
                      {relationship.sourceIdentifier}{" "}
                      {relationship.relationshipType.replaceAll("_", " ")}{" "}
                      {relationship.targetIdentifier}
                    </p>
                    <span className="text-slate-500">
                      {relationship.effectiveTo ? "Previous" : "Current"}
                    </span>
                  </div>
                  <p className="mt-1">
                    {relationship.sourceName} → {relationship.targetName}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    From {formatAustralianDateTime(relationship.effectiveFrom)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl border bg-[var(--surface)] p-4 text-sm">
              No relationships recorded.
            </p>
          )}
        </div>
        <aside className="rounded-xl border bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold">Add relationship</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Assembly cycles are rejected by the database.
          </p>
          <div className="mt-4">
            <AssetRelationshipForm
              assetId={asset.id}
              assets={assetOptions.filter((option) => option.id !== asset.id)}
            />
          </div>
        </aside>
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
