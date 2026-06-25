import { Edit, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductOptionsStatusBadge } from "./product-options-status-badge";

type MobileOptionItem = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  code?: string;
};

export function ProductOptionsMobileCardList({
  items,
  onEdit,
  onToggleStatus,
}: {
  items: MobileOptionItem[];
  onEdit: (item: MobileOptionItem) => void;
  onToggleStatus: (item: MobileOptionItem) => void;
}) {
  return (
    <div className="grid gap-4 md:hidden">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{item.name}</p>
                {item.code ? (
                  <p className="mt-1 text-xs font-medium tracking-wide text-slate-600">
                    {item.code}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description || "No description"}
                </p>
              </div>
              <ProductOptionsStatusBadge isActive={item.isActive} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="h-8 px-3 text-xs" onClick={() => onEdit(item)} variant="outline">
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </Button>
              <Button
                className="h-8 px-3 text-xs"
                onClick={() => onToggleStatus(item)}
                variant="outline"
              >
                <Power className="mr-2 h-3 w-3" />
                {item.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
