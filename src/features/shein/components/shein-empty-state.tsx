export function SheinEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border bg-card p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
