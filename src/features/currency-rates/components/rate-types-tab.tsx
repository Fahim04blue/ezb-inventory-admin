import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RateTypeView } from "@/features/rate-types/types/rate-type";

export function RateTypesTab({
  isLoading,
  rateTypes,
  onEdit,
  onToggleStatus,
}: {
  isLoading: boolean;
  rateTypes: RateTypeView[];
  onEdit: (rateType: RateTypeView) => void;
  onToggleStatus: (rateType: RateTypeView) => void;
}) {
  if (isLoading) {
    return (
      <>
        <TableSkeleton columns={5} rows={5} />
        <CardListSkeleton cards={3} />
      </>
    );
  }

  if (rateTypes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 text-sm text-muted-foreground">
          No rate types yet. Add reusable labels for selling, card, cargo, and internal rates.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] gap-4 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
              <div>Name</div>
              <div>Code</div>
              <div>Description</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-border">
              {rateTypes.map((rateType) => (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] items-center gap-4 px-4 py-3 hover:bg-muted/50"
                  key={rateType.id}
                >
                  <div className="font-medium">{rateType.name}</div>
                  <div className="text-sm font-medium text-slate-700">{rateType.code}</div>
                  <div className="text-sm text-muted-foreground">{rateType.description || "No description"}</div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${rateType.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                      {rateType.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="h-8 px-3 text-xs" onClick={() => onEdit(rateType)} variant="outline">
                      Edit
                    </Button>
                    <Button className="h-8 px-3 text-xs" onClick={() => onToggleStatus(rateType)} variant="outline">
                      {rateType.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {rateTypes.map((rateType) => (
          <Card key={rateType.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{rateType.name}</p>
                  <p className="mt-1 text-xs font-medium tracking-wide text-slate-600">{rateType.code}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rateType.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                  {rateType.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{rateType.description || "No description"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="w-auto px-4" onClick={() => onEdit(rateType)} variant="outline">
                  Edit
                </Button>
                <Button className="w-auto px-4" onClick={() => onToggleStatus(rateType)} variant="outline">
                  {rateType.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
