import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PurchaseEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PackageOpen className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No purchases yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        You haven't recorded any purchases. Add your first purchase to start tracking inventory and landed costs.
      </p>
      {onAdd && (
        <Button className="mt-6 w-auto" onClick={onAdd}>
          Add Purchase
        </Button>
      )}
    </div>
  );
}
