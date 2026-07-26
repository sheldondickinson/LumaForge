import { DatabaseStatus } from "@/components/database-status";

export const dynamic = "force-dynamic";

const plannedAreas = [
  "Assets",
  "Products",
  "Inventory",
  "Locations",
  "Props and Elements",
  "Controllers",
  "Power",
  "Configurations",
  "xLights",
  "Suppliers",
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold tracking-wide text-[var(--accent)] uppercase">
          Repository bootstrap
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Know every component. Validate every connection. Build every display.
        </h1>
        <p className="max-w-3xl text-base text-slate-600 dark:text-slate-300">
          LumaForge is being built as a local-network-first system for physical
          lighting assets, inventory, configurations, power, and xLights
          alignment.
        </p>
      </section>

      <section
        className="grid gap-4 md:grid-cols-2"
        aria-label="Platform status"
      >
        <article className="rounded-xl border bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Application</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            The application shell is ready. Operational modules will arrive in
            reviewed milestones.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Foundation only
          </div>
        </article>
        <DatabaseStatus />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Planned work areas</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            No operational data has been created during the bootstrap.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plannedAreas.map((area) => (
            <li
              key={area}
              className="rounded-lg border bg-[var(--surface)] px-4 py-3 text-sm font-medium"
            >
              {area}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
