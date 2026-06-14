import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";

export function CurrencyRatesPageHeader({
  onRefresh,
  onAdd,
}: {
  onRefresh: () => void;
  onAdd: () => void;
}) {
  return (
    <PageHeader
      title="Currency Rates"
      description="Manage exchange rates for purchases, cargo, and internal accounting. Rates are snapshotted on transactions, so changes here only affect future actions."
      actions={
        <>
          <Button className="w-auto px-4" onClick={onRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="w-auto px-4" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rate
          </Button>
        </>
      }
    />
  );
}
