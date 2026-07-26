import { checkDatabaseHealth } from "@/db/client";

export async function DatabaseStatus() {
  const isReady = (await checkDatabaseHealth()).status === "ok";

  return (
    <article className="rounded-xl border bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Database</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Readiness is checked without exposing connection details.
      </p>
      <div
        className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
          isReady
            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
        }`}
      >
        {isReady ? "PostgreSQL ready" : "PostgreSQL not connected"}
      </div>
    </article>
  );
}
