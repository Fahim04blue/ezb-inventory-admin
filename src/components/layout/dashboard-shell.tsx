import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(47,93,80,0.08),_transparent_32%),linear-gradient(180deg,_#f8f4ec_0%,_#f3ede2_100%)] text-foreground">
      <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden">
        <AppSidebar user={user} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden lg:pl-64">
          <DashboardHeader user={user} />
          <main className="min-w-0 w-full flex-1 px-4 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 lg:px-8">
            <div className="w-full min-w-0 overflow-x-hidden">
              {children}
            </div>
          </main>
          <MobileBottomNav user={user} />
        </div>
      </div>
    </div>
  );
}
