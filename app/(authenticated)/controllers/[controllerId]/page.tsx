import Link from "next/link";
import { notFound } from "next/navigation";
import { OutputAssignmentForm } from "@/components/output-assignment-form";
import { ValidationOverrideForm } from "@/components/validation-override-form";
import { runControllerValidationAction } from "@/app/(authenticated)/controllers/actions";
import {
  getControllerDetail,
  listPositionOptions,
} from "@/lib/controllers-power/service";
import { formatAustralianDateTime } from "@/lib/format";
import { getLatestValidationRun } from "@/lib/validations/service";

export const dynamic = "force-dynamic";

export default async function ControllerDetailPage({
  params,
}: {
  params: Promise<{ controllerId: string }>;
}) {
  const { controllerId } = await params;
  const [controller, positions, validationRun] = await Promise.all([
    getControllerDetail(controllerId),
    listPositionOptions(),
    getLatestValidationRun(controllerId),
  ]);
  if (!controller) notFound();
  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/controllers"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Controllers
        </Link>
        <p className="mt-3 font-mono text-sm text-slate-500">
          {controller.assetIdentifier}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Controller {controller.controllerCode} · {controller.definitionName}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {controller.manufacturer || "Manufacturer not recorded"}{" "}
          {controller.model || ""} ·{" "}
          {controller.protocol || "Protocol not recorded"}
        </p>
      </header>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Outputs</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Assigning a position elsewhere closes its previous assignment and
            regenerates its logical identifier.
          </p>
        </div>
        {controller.outputs.map((output) => (
          <article
            key={output.id}
            className="rounded-xl border bg-[var(--surface)] p-5"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-slate-500">
                  O{String(output.outputNumber).padStart(2, "0")} · Bank{" "}
                  {output.bankNumber}
                </p>
                <h3 className="text-lg font-semibold">{output.name}</h3>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold">
                  {output.logicalIdentifier || "Unassigned"}
                </p>
                {output.displayElementName ? (
                  <p className="text-sm">
                    {output.displayElementName} · {output.positionName}
                  </p>
                ) : null}
              </div>
            </div>
            <OutputAssignmentForm
              controllerId={controller.id}
              outputId={output.id}
              positions={positions}
            />
          </article>
        ))}
      </section>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Configuration validation</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Re-run after changing wiring, products, outputs or power
              allocation.
            </p>
          </div>
          <form
            action={runControllerValidationAction.bind(null, controller.id)}
          >
            <button className="min-h-11 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]">
              Run validation
            </button>
          </form>
        </div>
        {validationRun ? (
          <>
            <p className="text-sm text-slate-500">
              Latest run: {formatAustralianDateTime(validationRun.createdAt)}
            </p>
            <ol className="space-y-3">
              {validationRun.results.map((result) => (
                <li
                  key={result.id}
                  className="rounded-xl border bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-mono text-sm font-semibold">
                      {result.ruleCode}
                    </p>
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase">
                      {result.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{result.message}</p>
                  {Array.isArray(result.evidence.compatibleReplacementPsus) &&
                  result.evidence.compatibleReplacementPsus.every(
                    (item) => typeof item === "string",
                  ) &&
                  result.evidence.compatibleReplacementPsus.length ? (
                    <p className="mt-3 text-sm">
                      Compatible replacements:{" "}
                      {result.evidence.compatibleReplacementPsus.join(", ")}.{" "}
                      <Link
                        href="/power"
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        Select a PSU →
                      </Link>
                    </p>
                  ) : null}
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-medium">
                      Calculation evidence
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-3 text-xs">
                      {JSON.stringify(result.evidence, null, 2)}
                    </pre>
                  </details>
                  {result.overrideReason ? (
                    <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      Override: {result.overrideReason}
                    </p>
                  ) : result.overrideAllowed ? (
                    <ValidationOverrideForm
                      controllerId={controller.id}
                      resultId={result.id}
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="rounded-xl border bg-[var(--surface)] p-4">
            Validation has not been run for this controller.
          </p>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Power banks</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {controller.banks.map((bank) => (
            <article
              key={bank.id}
              className="rounded-xl border bg-[var(--surface)] p-4"
            >
              <p className="font-medium">
                Bank {bank.bankNumber} · {bank.name}
              </p>
              <p className="mt-1 text-sm">
                {bank.psuIdentifier
                  ? `${bank.psuIdentifier} · ${bank.psuName}`
                  : "No PSU allocated"}
              </p>
            </article>
          ))}
        </div>
        <Link
          href="/power"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Manage power supplies and allocations →
        </Link>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Assignment history</h2>
        {controller.assignmentHistory.length ? (
          <ol className="space-y-3">
            {controller.assignmentHistory.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border bg-[var(--surface)] p-4 text-sm"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-mono font-semibold">
                    {item.logicalIdentifier}
                  </p>
                  <span>{item.effectiveTo ? "Previous" : "Current"}</span>
                </div>
                <p className="mt-1">
                  {item.displayElementName} · {item.positionName}
                </p>
                <p className="mt-2 text-slate-500">
                  From {formatAustralianDateTime(item.effectiveFrom)}
                  {item.effectiveTo
                    ? ` to ${formatAustralianDateTime(item.effectiveTo)}`
                    : ""}
                </p>
                <p className="mt-2">{item.reason}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border bg-[var(--surface)] p-4">
            No output assignments recorded.
          </p>
        )}
      </section>
    </div>
  );
}
