import Link from "next/link";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AuthenticatedUser } from "@/lib/auth/service";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Assets", href: "/assets" },
  { label: "Products", href: "/products" },
  { label: "Stocktakes", href: "/stocktakes" },
  { label: "Locations", href: "/locations" },
  { label: "Props and Elements", href: "/elements" },
  { label: "Controllers" },
  { label: "Power" },
  { label: "Configurations" },
  { label: "xLights" },
  { label: "Suppliers" },
  { label: "Settings" },
];

export function AppShell({
  children,
  user,
  logoutAction,
}: {
  children: React.ReactNode;
  user: AuthenticatedUser;
  logoutAction: () => Promise<void>;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight"
            aria-label="LumaForge dashboard"
          >
            LumaForge
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled
              title="Global search is planned for a later milestone"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm text-slate-500 disabled:cursor-not-allowed"
            >
              <Search aria-hidden="true" size={18} />
              <span className="hidden sm:inline">Search (planned)</span>
            </button>
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="max-w-52 truncate text-sm font-medium">
                {user.email}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium hover:bg-[var(--surface-muted)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[14rem_1fr]">
        <nav
          aria-label="Primary navigation"
          className="border-b bg-[var(--surface)] px-4 py-3 lg:min-h-[calc(100vh-4rem)] lg:border-r lg:border-b-0 lg:px-3 lg:py-6"
        >
          <ul className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {navigation.map((item) => (
              <li key={item.label} className="shrink-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-slate-500"
                    title={`${item.label} is planned for a later milestone`}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
