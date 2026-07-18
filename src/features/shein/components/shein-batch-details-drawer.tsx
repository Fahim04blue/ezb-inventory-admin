"use client";

import {
  Calendar,
  Copy,
  Edit,
  ExternalLink,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import { SheinBatchItemStatus } from "@/lib/domain-enums";
import { cn } from "@/lib/utils";
import type { SheinBatchItemView, SheinBatchView } from "../types/shein.types";
import { SheinSkuCopy } from "./shein-sku-copy";
import { SheinSourceBadge } from "./shein-source-badge";
import { SheinStatusBadge } from "./shein-status-badge";
import { canManageBatchItems } from "./shein-batches-table";

export function SheinBatchDetailsDrawer({
  batch,
  onClose,
  onAddItem,
  onEditItem,
  onDeleteItem,
  isMutating = false,
}: {
  batch: SheinBatchView | null;
  onClose: () => void;
  onAddItem: (batch: SheinBatchView) => void;
  onEditItem: (batch: SheinBatchView, item: SheinBatchItemView) => void;
  onDeleteItem: (item: SheinBatchItemView) => void;
  isMutating?: boolean;
}) {
  return (
    <CrudDrawer
      bodyClassName="bg-card px-6 py-5"
      className="md:w-[min(1050px,100vw)]"
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
              {canManageBatchItems(batch) ? (
                <Button className="h-9 w-auto gap-2 rounded-lg bg-emerald-700 px-4 hover:bg-emerald-800" onClick={() => onAddItem(batch)}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              ) : (
                <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Items moved to order</span>
              )}
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <div className="hidden min-w-[920px] grid-cols-[60px_115px_100px_minmax(145px,1fr)_115px_110px_130px_44px] gap-3 border-b bg-slate-50/60 px-4 py-3 text-xs font-semibold text-slate-600 md:grid">
                <div>Image</div>
                <div>SKU / Qty</div>
                <div>Variant</div>
                <div>Customer</div>
                <div>Status</div>
                <div>Product link</div>
                <div>Payable</div>
                <div><span className="sr-only">Actions</span></div>
              </div>
              <div className="divide-y">
                {batch.items?.map((item) => (
                  <div
                    className="grid gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50/60 md:min-w-[920px] md:grid-cols-[60px_115px_100px_minmax(145px,1fr)_115px_110px_130px_44px] md:items-center"
                    key={item.id}
                  >
                    <ItemThumbnail item={item} />
                    <div className="min-w-0">
                      <SheinSkuCopy sku={item.sku} />
                      <p className="mt-1 text-xs font-medium text-slate-600">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm text-slate-700">{[item.size, item.color].filter(Boolean).join(" · ") || "-"}</p>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.customerName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-muted-foreground">{item.phone}</p>
                        <SheinSourceBadge source={item.customerSource} />
                      </div>
                    </div>
                    <SheinStatusBadge status={item.status} />
                    {item.sheinLink ? (
                      <a
                        className="inline-flex w-fit items-center gap-1 text-xs font-semibold !text-blue-600 !underline decoration-blue-300 underline-offset-2 transition-colors hover:!text-blue-800 hover:decoration-blue-600"
                        href={item.sheinLink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View product
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No link</span>
                    )}
                    <div className="font-semibold">{formatCurrency(item.totalCustomerPayableBdt ?? item.customerQuotedPriceBdt)}</div>
                    {item.status === SheinBatchItemStatus.MOVED_TO_ORDER ? (
                      <span className="text-center text-xs text-muted-foreground">—</span>
                    ) : (
                      <ItemActionsMenu
                        isMutating={isMutating}
                        item={item}
                        onDelete={() => onDeleteItem(item)}
                        onEdit={() => onEditItem(batch, item)}
                      />
                    )}
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

function ItemActionsMenu({
  item,
  isMutating,
  onEdit,
  onDelete,
}: {
  item: SheinBatchItemView;
  isMutating: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Actions for SKU ${item.sku || "item"}`}
          className="h-8 w-8 rounded-lg px-0 hover:border-slate-400 hover:bg-slate-100"
          disabled={isMutating}
          type="button"
          variant="outline"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[160] w-40 rounded-xl bg-white p-1 shadow-xl">
        <Button
          className="h-9 w-full justify-start gap-2 border-0 bg-transparent px-2 text-sm text-slate-700 shadow-none"
          disabled={isMutating}
          onClick={() => run(onEdit)}
          type="button"
          variant="outline"
        >
          <Edit className="h-4 w-4" />
          Edit item
        </Button>
        <Button
          className="h-9 w-full justify-start gap-2 border-0 bg-transparent px-2 text-sm text-red-700 shadow-none hover:bg-red-50 hover:text-red-700"
          disabled={isMutating}
          onClick={() => run(onDelete)}
          type="button"
          variant="outline"
        >
          {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {isMutating ? "Deleting…" : "Delete item"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function ItemThumbnail({ item }: { item: SheinBatchItemView }) {
  const imageUrl = item.imageUrl || item.screenshotUrl;

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-slate-50">
      {imageUrl ? (
        // SHEIN item images can come from user-entered external URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${item.productName} product`}
          className="h-full w-full object-cover"
          loading="lazy"
          src={imageUrl}
        />
      ) : (
        <ImageIcon aria-hidden="true" className="h-5 w-5 text-slate-300" />
      )}
    </div>
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
