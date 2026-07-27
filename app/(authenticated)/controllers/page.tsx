import Link from "next/link";
import { listControllers } from "@/lib/controllers-power/service";

export const dynamic = "force-dynamic";

export default async function ControllersPage() {
  const controllers = await listControllers();
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            Deployment
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Controllers
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Manage physical controllers, outputs, power banks and logical
            assignments.
          </p>
        </div>
        <Link
          href="/controllers/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]"
        >
          New controller
        </Link>
      </header>
      {controllers.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {controllers.map((controller) => (
            <Link
              key={controller.id}
              href={`/controllers/${controller.id}`}
              className="rounded-xl border bg-[var(--surface)] p-5 hover:border-[var(--accent)]"
            >
              <p className="font-mono text-sm text-slate-500">
                Controller {controller.controllerCode} ·{" "}
                {controller.assetIdentifier}
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {controller.definitionName}
              </h2>
              <p className="mt-2 text-sm">{controller.friendlyName}</p>
              <p className="mt-4 text-sm font-medium">
                {controller.assignedCount} of {controller.outputCount} outputs
                assigned · {controller.powerBankCount} power banks
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border bg-[var(--surface)] p-5">
          No controller assets have been configured.
        </p>
      )}
    </div>
  );
}
