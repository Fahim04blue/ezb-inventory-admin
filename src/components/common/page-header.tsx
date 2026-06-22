type PageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground break-words">{description}</p>
      </div>
      {actions ? <div className="flex w-full flex-wrap justify-end gap-2 md:w-auto md:shrink-0">{actions}</div> : null}
    </div>
  );
}
