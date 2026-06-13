import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";

export default function LoadingProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />
        }
        description="Manage catalog products and variants. Stock remains read-only here until stock workflows are built."
        title="Products"
      />
      <div className="hidden lg:block">
        <TableSkeleton columns={6} rows={6} />
      </div>
      <div className="lg:hidden">
        <CardListSkeleton cards={4} />
      </div>
    </div>
  );
}
