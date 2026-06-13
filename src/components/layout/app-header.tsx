type AppHeaderProps = {
  title: string;
  description?: string;
};

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Essentials by Zatab
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
