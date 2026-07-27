import Link from "next/link";
import { formatLabel } from "@/lib/format";
import { listLocations } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await listLocations();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--accent)] uppercase">
            Storage hierarchy
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Stable location codes organise sheds, racks, shelves and totes.
          </p>
        </div>
        <Link
          href="/locations/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]"
        >
          Create location
        </Link>
      </header>

      {locations.length === 0 ? (
        <div className="rounded-xl border bg-[var(--surface)] p-8 text-center">
          <h2 className="text-lg font-semibold">No locations yet</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Create the first shed, room or storage zone.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Assets</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {locations.map((location) => (
                <tr key={location.id}>
                  <td
                    className="px-4 py-3"
                    style={{ paddingLeft: `${1 + location.depth * 1.25}rem` }}
                  >
                    <span className="font-mono font-semibold text-[var(--accent)]">
                      {location.code}
                    </span>
                    <span className="ml-3">{location.name}</span>
                    <p className="mt-1 text-xs text-slate-500">
                      {location.path}
                    </p>
                  </td>
                  <td className="px-4 py-3">{formatLabel(location.kind)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {location.directAssetCount}
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
