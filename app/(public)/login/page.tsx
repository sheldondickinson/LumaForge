import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentAuthentication } from "@/lib/auth/current-user";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentAuthentication()) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold">LumaForge</p>
          <ThemeToggle />
        </div>

        <section className="rounded-xl border bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold tracking-wide text-[var(--accent)] uppercase">
              Local administrator
            </p>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Use the administrator account created for this installation.
            </p>
          </div>
          <LoginForm />
        </section>

        <aside className="rounded-lg border bg-[var(--surface-muted)] p-4 text-sm">
          <p className="font-semibold">First run?</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Apply the database migrations, then create the first administrator
            with the documented <code>pnpm admin:create</code> command.
          </p>
        </aside>
      </div>
    </main>
  );
}
