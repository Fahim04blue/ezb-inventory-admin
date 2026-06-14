import { Card, CardContent } from "@/components/ui/card";

export function ProductEmptyState() {
  return (
    <Card>
      <CardContent className="pt-8">
        <p className="text-sm text-muted-foreground">
          No products yet. Click Add Product to create your first catalog item.
        </p>
      </CardContent>
    </Card>
  );
}
