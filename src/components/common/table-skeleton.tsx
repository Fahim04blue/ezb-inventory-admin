type TableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function TableSkeleton({
  columns = 5,
  rows = 6,
}: TableSkeletonProps) {
  return (
    <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
      <div className="grid gap-4 border-b border-border px-6 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div className="h-4 animate-pulse rounded bg-muted" key={`header-${index}`} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            className="grid gap-4 px-6 py-5"
            key={`row-${rowIndex}`}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, colIndex) => (
              <div
                className="h-4 animate-pulse rounded bg-muted"
                key={`cell-${rowIndex}-${colIndex}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
