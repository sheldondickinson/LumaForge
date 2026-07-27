import Link from "next/link";
import { PowerAllocationForm } from "@/components/power-allocation-form";
import { listPowerBanks, listPsus } from "@/lib/controllers-power/service";

export const dynamic = "force-dynamic";

export default async function PowerPage() {
  const [psus, banks] = await Promise.all([listPsus(), listPowerBanks()]);
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            Deployment
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Power</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Manage decimal-safe PSU ratings and effective-dated controller-bank
            allocations.
          </p>
        </div>
        <Link
          href="/power/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]"
        >
          Configure PSU
        </Link>
      </header>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Power supplies</h2>
        {psus.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {psus.map((psu) => (
              <article
                key={psu.id}
                className="rounded-xl border bg-[var(--surface)] p-5"
              >
                <p className="font-mono text-sm text-slate-500">
                  {psu.assetIdentifier}
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  {psu.definitionName}
                </h3>
                <p className="mt-2 text-sm">
                  {psu.outputVoltageV} V · {psu.maximumCurrentA} A ·{" "}
                  {psu.maximumPowerW} W
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-[var(--surface)] p-4">
            No power supplies configured.
          </p>
        )}
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Controller power banks</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            A replacement closes the previous allocation. Run validation from
            the controller after changing a bank supply.
          </p>
        </div>
        {banks.length ? (
          <div className="space-y-3">
            {banks.map((bank) => (
              <article
                key={bank.id}
                className="rounded-xl border bg-[var(--surface)] p-5"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">
                    Controller {bank.controllerCode} · Bank {bank.bankNumber}
                  </p>
                  <p className="text-sm">
                    {bank.psuIdentifier
                      ? `${bank.psuIdentifier} · ${bank.psuName}`
                      : "No PSU allocated"}
                  </p>
                </div>
                {psus.length ? (
                  <PowerAllocationForm
                    bankId={bank.id}
                    controllerId={bank.controllerId}
                    psus={psus}
                  />
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-[var(--surface)] p-4">
            Configure a controller to create power banks.
          </p>
        )}
      </section>
    </div>
  );
}
