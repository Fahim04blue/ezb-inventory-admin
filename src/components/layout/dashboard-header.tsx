import { MobileSidebar } from "@/components/layout/mobile-sidebar";

type DashboardUser = {
  name: string | null;
  email: string;
};

type DashboardHeaderProps = {
  user: DashboardUser | null;
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Essentials by Zatab
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Inventory Admin
          </h1>
        </div>
        <MobileSidebar user={user} />
      </div>
    </header>
  );
}
