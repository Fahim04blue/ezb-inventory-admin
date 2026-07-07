"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sheinStatusLabel } from "../utils/shein-status";

const styles: Record<string, string> = {
  CONFIRMED: "bg-sky-100 text-sky-700",
  IN_CARGO: "bg-amber-100 text-amber-800",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  READY_FOR_DELIVERY: "bg-emerald-100 text-emerald-700",
  PARTIALLY_ARRIVED: "bg-indigo-100 text-indigo-700",
  WAITING: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-zinc-100 text-zinc-700",
  MOVED_TO_ORDER: "bg-zinc-100 text-zinc-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function SheinStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("border-transparent", styles[status] ?? "bg-slate-100 text-slate-700")} variant="outline">
      {sheinStatusLabel(status)}
    </Badge>
  );
}
