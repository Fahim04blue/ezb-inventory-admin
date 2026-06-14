import { Card, CardContent } from "@/components/ui/card";

export function SupplierEmptyState() {
  return (
    <Card>
      <CardContent className="pt-8">
        <p className="text-sm text-muted-foreground">
          No suppliers yet. Click Add Supplier to create the first one.
        </p>
      </CardContent>
    </Card>
  );
}
