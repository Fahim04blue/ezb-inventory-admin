import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

type DashboardUser = {
  name: string | null;
  email: string;
};

type DashboardShellProps = {
  children: React.ReactNode;
  user: DashboardUser | null;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(47,93,80,0.08),_transparent_32%),linear-gradient(180deg,_#f8f4ec_0%,_#f3ede2_100%)] text-foreground">
      <div className="flex min-h-screen">
        <AppSidebar user={user} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardHeader user={user} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
