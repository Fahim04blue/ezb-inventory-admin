type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(47,93,80,0.08),_transparent_32%),linear-gradient(180deg,_#f8f4ec_0%,_#f3ede2_100%)]">
      {children}
    </div>
  );
}
