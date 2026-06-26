import { Card, CardContent } from "@/components/ui/card";

export function CurrencyRateEmptyState() {
  return (
    <Card>
      <CardContent className="pt-8">
        <p className="text-sm text-muted-foreground">
          No rates yet. Click Add Rate to create the first one.
        </p>
      </CardContent>
    </Card>
  );
}
