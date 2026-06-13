import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";

export default function LoadingCurrencyRatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="h-10 w-36 animate-pulse rounded-xl bg-muted" />
        }
        description="Manage reusable card purchase and cargo payment exchange rates."
        title="Currency Rates"
      />
      <div className="hidden lg:block">
        <TableSkeleton columns={7} rows={6} />
      </div>
      <div className="lg:hidden">
        <CardListSkeleton cards={4} />
      </div>
    </div>
  );
}
