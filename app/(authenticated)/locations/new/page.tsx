import Link from "next/link";
import { LocationForm } from "@/components/location-form";
import { listLocations } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

export default async function NewLocationPage() {
  const locations = await listLocations();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href="/locations"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Locations
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Create location
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Nest locations to match the physical storage hierarchy.
        </p>
      </header>
      <div className="rounded-xl border bg-[var(--surface)] p-5 sm:p-6">
        <LocationForm locations={locations} />
      </div>
    </div>
  );
}
