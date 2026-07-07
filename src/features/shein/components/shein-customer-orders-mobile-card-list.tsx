import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { SheinCustomerOrderGroup } from "../types/shein.types";
import { SheinSourceBadge } from "./shein-source-badge";
import { SheinStatusBadge } from "./shein-status-badge";

export function SheinCustomerOrdersMobileCardList({
  groups,
  onOpen,
  onCreate,
}: {
  groups: SheinCustomerOrderGroup[];
  onOpen: (group: SheinCustomerOrderGroup) => void;
  onCreate: (group: SheinCustomerOrderGroup) => void;
}) {
  return (
    <div className="grid gap-4 md:hidden">
      {groups.map((group) => (
        <CustomerOrderMobileCard key={group.key} group={group} onCreate={onCreate} onOpen={onOpen} />
      ))}
    </div>
  );
}

function CustomerOrderMobileCard({
  group,
  onOpen,
  onCreate,
}: {
  group: SheinCustomerOrderGroup;
  onOpen: (group: SheinCustomerOrderGroup) => void;
  onCreate: (group: SheinCustomerOrderGroup) => void;
}) {
  const canCreateOrder = group.items.some((item) => item.status === "RECEIVED" && !item.movedToOrderId);

  return (
    <div className="rounded-2xl border bg-card p-5 text-left shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{group.customerName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">{group.phone}</p>
            <SheinSourceBadge source={group.customerSource} />
          </div>
        </div>
        <SheinStatusBadge status={group.status} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {group.totalItems} items · {group.arrivedItems} arrived · {group.waitingItems} waiting
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <span>Advance {formatCurrency(group.totalAdvance)}</span>
        <span>Due {formatCurrency(group.totalDue)}</span>
        <span className="col-span-2 truncate">
          Batches: {group.batches.join(", ") || "None"}
        </span>
      </div>
      <div className={`mt-4 grid gap-3 ${canCreateOrder ? "grid-cols-2" : "grid-cols-1"}`}>
        <Button className="h-10 rounded-lg" variant="outline" onClick={() => onOpen(group)}>
          View
        </Button>
        {canCreateOrder ? (
          <Button className="h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800" onClick={() => onCreate(group)}>
            Create Order
          </Button>
        ) : null}
      </div>
    </div>
  );
}
