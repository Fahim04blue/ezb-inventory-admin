import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";

export default function LoadingSuppliersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />
        }
        description="Maintain supplier records before purchase workflows are added."
        title="Suppliers"
      />
      <div className="hidden lg:block">
        <TableSkeleton columns={5} rows={6} />
      </div>
      <div className="lg:hidden">
        <CardListSkeleton cards={4} />
      </div>
    </div>
  );
}
