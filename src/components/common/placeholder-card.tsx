type PlaceholderCardProps = {
  title: string;
  description: string;
};

export function PlaceholderCard({
  title,
  description,
}: PlaceholderCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
