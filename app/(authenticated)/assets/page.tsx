import Link from "next/link";
import { listAssets } from "@/lib/assets/service";
import { formatAssetStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q ?? "";
  const assets = await listAssets(query);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--accent)] uppercase">
            Physical inventory
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Every separately tracked component has one permanent identifier.
          </p>
        </div>
        <Link
          href="/assets/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]"
        >
          Create assets
        </Link>
      </header>

      <form action="/assets" className="flex gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search asset ID, name, class or product"
          className="min-h-11 min-w-0 flex-1 rounded-lg border bg-[var(--surface)] px-3"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg border px-4 font-medium"
        >
          Search
        </button>
      </form>

      {assets.length === 0 ? (
        <div className="rounded-xl border bg-[var(--surface)] p-8 text-center">
          <h2 className="text-lg font-semibold">No assets found</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {query
              ? "Try a different search."
              : "Create the first physical assets to begin tracking inventory."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Asset ID</th>
                <th className="px-4 py-3 font-semibold">Friendly name</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                  Product
                </th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/assets/${asset.id}`}
                      className="font-mono font-semibold text-[var(--accent)] hover:underline"
                    >
                      {asset.assetIdentifier}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{asset.friendlyName}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {asset.productName
                      ? `${asset.productName} · r${asset.productRevisionNumber}`
                      : asset.assetClassName}
                  </td>
                  <td className="px-4 py-3">
                    {formatAssetStatus(asset.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
