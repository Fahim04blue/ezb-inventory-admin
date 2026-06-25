import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";

export default function LoadingProductOptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={<div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />}
        description="Manage reusable options used across products, purchases, orders, and pricing."
        title="Product Options"
      />
      <div className="space-y-6">
        <div className="h-14 animate-pulse rounded-3xl border border-border bg-muted/40" />
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 h-6 w-40 animate-pulse rounded bg-muted" />
          <TableSkeleton columns={4} rows={5} />
          <CardListSkeleton cards={3} />
        </div>
      </div>
    </div>
  );
}
