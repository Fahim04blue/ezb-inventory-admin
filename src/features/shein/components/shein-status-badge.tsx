"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const labels: Record<string, string> = {
  CONFIRMED: "Confirmed",
  IN_CARGO: "Shipped / In Cargo",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
  READY_FOR_DELIVERY: "Ready For Delivery",
  PARTIALLY_ARRIVED: "Partially Arrived",
  WAITING: "Waiting",
  COMPLETED: "Completed",
  MOVED_TO_ORDER: "Moved To Order",
};

export function SheinStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("border-transparent", styles[status] ?? "bg-slate-100 text-slate-700")} variant="outline">
      {labels[status] ?? status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}
    </Badge>
  );
}
