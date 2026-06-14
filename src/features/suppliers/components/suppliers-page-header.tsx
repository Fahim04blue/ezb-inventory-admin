import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";

export function SuppliersPageHeader({
  onRefresh,
  onAdd,
}: {
  onRefresh: () => void;
  onAdd: () => void;
}) {
  return (
    <PageHeader
      title="Suppliers"
      description="List suppliers first and manage them through a consistent right-side drawer."
      actions={
        <>
          <Button className="w-auto px-4" onClick={onRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="w-auto px-4" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </>
      }
    />
  );
}
