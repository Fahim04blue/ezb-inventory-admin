type CardListSkeletonProps = {
  cards?: number;
};

export function CardListSkeleton({
  cards = 4,
}: CardListSkeletonProps) {
  return (
    <div className="grid gap-4 md:hidden">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          className="rounded-3xl border border-border bg-card p-5 shadow-sm"
          key={`card-${index}`}
        >
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-5 space-y-2">
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
