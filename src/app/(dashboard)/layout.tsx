import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  return (
    <DashboardShell
      user={
        user
          ? {
              name: user.name,
              email: user.email,
            }
          : null
      }
    >
      {children}
    </DashboardShell>
  );
}
