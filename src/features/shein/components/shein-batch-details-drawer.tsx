"use client";

import {
  Calendar,
  Copy,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SheinBatchItemView, SheinBatchView } from "../types/shein.types";
import { SheinSkuCopy } from "./shein-sku-copy";
import { SheinSourceBadge } from "./shein-source-badge";
import { SheinStatusBadge } from "./shein-status-badge";

export function SheinBatchDetailsDrawer({
  batch,
  onClose,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: {
  batch: SheinBatchView | null;
  onClose: () => void;
  onAddItem: (batch: SheinBatchView) => void;
  onEditItem: (batch: SheinBatchView, item: SheinBatchItemView) => void;
  onDeleteItem: (item: SheinBatchItemView) => void;
}) {
  return (
    <CrudDrawer
      bodyClassName="bg-card px-6 py-5"
      className="md:w-[min(900px,100vw)]"
      description={batch ? `${batch.sourceCountry} · ${batch.currency}` : undefined}
      headerClassName="px-6 py-5"
      onClose={onClose}
      open={batch !== null}
      title={batch?.batchName ?? "SHEIN Batch"}
    >
      {batch ? (
        <div className="space-y-5">
          <div className="grid gap-4 rounded-xl border bg-card px-5 py-4 text-sm shadow-sm sm:grid-cols-5">
            <Summary label="Status" value={<SheinStatusBadge status={batch.status} />} />
            <Summary label="Items" value={formatNumber(batch.itemCount)} />
            <Summary label="Total RM" value={formatNumber(batch.totalRm)} />
            <Summary label="Order total (BDT)" value={formatCurrency(totalOrderBdt(batch))} />
            <Summary label="Customer value" value={formatCurrency(batch.estimatedCustomerValue)} />
          </div>

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="text-base font-semibold text-slate-950">Batch details</h3>
            </div>
            <div className="grid gap-5 px-5 py-4 md:grid-cols-[1.1fr_1fr_1fr]">
              <div className="space-y-4">
                <Detail label="SHEIN Order Number" value={batch.sheinOrderNumbers || "-"} copyValue={batch.sheinOrderNumbers} />
                <Detail label="SHEIN Tracking Number" value={batch.sheinTrackingNumber || "-"} copyValue={batch.sheinTrackingNumber} />
                <Detail
                  icon={Calendar}
                  label="Order Date"
                  value={batch.orderDate ? formatDate(batch.orderDate) : "-"}
                />
                <Detail label="Notes" value={batch.notes || "-"} />
              </div>
              <div className="space-y-4 border-border md:border-l md:pl-5">
                <Detail label="Bank Rate (1 RM = X BDT)" value={batch.bankRate ? `1 RM = ${formatNumber(batch.bankRate)} BDT` : "Pending"} strong />
                <Detail label="Customer RM Rate" value={formatNumber(batch.customerRmRate)} strong />
                <Detail label="Customer Weight BDT/g" value={formatNumber(batch.customerWeightRatePerGram)} strong />
              </div>
              <div className="space-y-4">
                <Detail label="Actual Bank Rate" value={batch.bankRate ? formatNumber(batch.bankRate) : "Pending"} strong />
                <Detail label="Actual Cargo BDT/g" value={formatNumber(batch.actualCargoRatePerGram)} strong />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-950">Batch items</h3>
              <Button className="h-9 w-auto gap-2 rounded-lg bg-emerald-700 px-4 hover:bg-emerald-800" onClick={() => onAddItem(batch)}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="hidden grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)_110px_140px_150px] gap-3 border-b px-4 py-3 text-xs font-semibold text-muted-foreground md:grid">
                <div>Item</div>
                <div>Variant</div>
                <div>Customer</div>
                <div>Status</div>
                <div>Quote / Payable</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {batch.items?.map((item) => (
                  <div
                    className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)_110px_140px_150px] md:items-center"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.productName}</p>
                      <SheinSkuCopy sku={item.sku} />
                      <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{[item.size, item.color].filter(Boolean).join(" · ") || "-"}</p>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.customerName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-muted-foreground">{item.phone}</p>
                        <SheinSourceBadge source={item.customerSource} />
                      </div>
                    </div>
                    <SheinStatusBadge status={item.status} />
                    <div className="font-semibold">{formatCurrency(item.totalCustomerPayableBdt ?? item.customerQuotedPriceBdt)}</div>
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-8 w-auto gap-1.5 rounded-lg px-3 text-xs" variant="outline" onClick={() => onEditItem(batch, item)}>
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button className="h-8 w-auto gap-1.5 rounded-lg border-red-200 px-3 text-xs text-red-700" variant="outline" onClick={() => onDeleteItem(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {!batch.items?.length ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No SHEIN items in this batch yet.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="grid gap-4 rounded-xl border bg-card px-5 py-4 text-sm shadow-sm sm:grid-cols-3">
            <FooterMeta label="Created" value={formatDateTime(batch.createdAt)} />
            <FooterMeta label="Last updated" value={formatDateTime(batch.updatedAt)} />
            <FooterMeta label="Notes" value={batch.notes || "-"} />
          </div>
        </div>
      ) : null}
    </CrudDrawer>
  );
}

function totalOrderBdt(batch: SheinBatchView) {
  return Number(batch.bankRate ?? 0) * Number(batch.totalRm);
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function Detail({
  label,
  value,
  copyValue,
  icon: Icon,
  strong = false,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string | null;
  icon?: typeof Calendar;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={cn("mt-1 flex items-center gap-2 text-sm", strong ? "font-semibold text-slate-950" : "text-slate-800")}>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
        <span className="min-w-0 break-words">{value}</span>
        {copyValue ? (
          <button
            className="text-muted-foreground hover:text-slate-950"
            onClick={() => void navigator.clipboard?.writeText(copyValue)}
            type="button"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FooterMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-slate-800">{value}</p>
    </div>
  );
}
