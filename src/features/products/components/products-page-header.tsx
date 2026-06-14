import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";

export function ProductsPageHeader({
  onRefresh,
  onAdd,
}: {
  onRefresh: () => void;
  onAdd: () => void;
}) {
  return (
    <PageHeader
      title="Products"
      description="Manage catalog products and variants with predefined brands and categories. Stock remains read-only and starts at 0."
      actions={
        <>
          <Button className="w-auto px-4" onClick={onRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="w-auto px-4" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </>
      }
    />
  );
}
