import { AppShell } from "@/components/app-shell";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { logoutAction } from "./logout-action";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireCurrentAuthentication();

  return (
    <AppShell user={user} logoutAction={logoutAction}>
      {children}
    </AppShell>
  );
}
