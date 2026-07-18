import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CrudPageHeaderProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  addLabel?: string;
}

export function CrudPageHeader({
  title,
  description,
  onAdd,
  addLabel = "Add New",
}: CrudPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onAdd && (
          <Button onClick={onAdd} className="h-9 w-auto gap-2">
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
