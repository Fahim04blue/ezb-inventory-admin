"use client";

import {
    ArrowLeft,
    Box,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    CloudUpload,
    ExternalLink,
    FileUp,
    Globe2,
    Loader2,
    Package,
    Plus,
    Save,
    ShoppingCart,
    Trash2,
    Users,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { OrderSource, SheinBatchItemStatus } from "@/lib/domain-enums";
import { formatCurrency, formatEnum, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SheinBatchItemView, SheinBatchView } from "../types/shein.types";
import { SheinSkuCopy } from "./shein-sku-copy";
import { SheinSourceBadge } from "./shein-source-badge";
import { SheinStatusBadge } from "./shein-status-badge";
import { SheinBulkImportDrawer } from "./shein-bulk-import-drawer";

type DraftItem = {
  localId: string;
  customerName: string;
  phone: string;
  customerSource: string;
  address: string;
  sku: string;
  sheinLink: string;
  imageUrl: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  screenshotUrl: string;
  size: string;
  color: string;
  quantity: string;
  customerQuotedPriceBdt: string;
  advanceReceivedBdt: string;
  actualSheinPriceRm: string;
  bankRateSnapshot: string;
  customerWeightRateSnapshot: string;
  actualCargoRateSnapshot: string;
  status: SheinBatchItemStatus;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newDraft(batch?: SheinBatchView | null): DraftItem {
  return {
    localId: makeId(),
    customerName: "",
    phone: "",
    customerSource: "",
    address: "",
    sku: "",
    sheinLink: "",
    imageUrl: "",
    imageFile: null,
    imagePreviewUrl: null,
    screenshotUrl: "",
    size: "",
    color: "",
    quantity: "1",
    customerQuotedPriceBdt: "",
    advanceReceivedBdt: "0",
    actualSheinPriceRm: "",
    bankRateSnapshot: batch?.bankRate ?? "",
    customerWeightRateSnapshot: batch?.customerWeightRatePerGram ?? "1.25",
    actualCargoRateSnapshot: batch?.actualCargoRatePerGram ?? "0.98",
    status: SheinBatchItemStatus.CONFIRMED,
  };
}

function rowReady(row: DraftItem) {
  return Boolean(
    row.sku.trim() &&
      row.sheinLink.trim(),
  );
}

async function uploadSheinImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/product-variant-images", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok || result.status === "error") {
    throw new Error(result.message || "Failed to upload image.");
  }

  return result.data as { imagePath: string; imageUrl: string };
}

function numberOrDefault(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPayload(row: DraftItem, imageUrl = row.imageUrl) {
  return {
    customerName: row.customerName,
    phone: row.phone,
    customerSource: row.customerSource,
    address: row.address,
    productName: "SHEIN item",
    sku: row.sku,
    sheinLink: row.sheinLink,
    imageUrl,
    screenshotUrl: row.screenshotUrl,
    size: row.size,
    color: row.color,
    quantity: Math.max(1, Math.trunc(numberOrDefault(row.quantity, 1))),
    customerQuotedPriceBdt: numberOrDefault(row.customerQuotedPriceBdt, 0),
    advanceReceivedBdt: numberOrDefault(row.advanceReceivedBdt, 0),
    actualSheinPriceRm: nullableNumber(row.actualSheinPriceRm),
    bankRateSnapshot: nullableNumber(row.bankRateSnapshot),
    actualWeightGram: null,
    customerWeightRateSnapshot: numberOrDefault(row.customerWeightRateSnapshot, 1.25),
    actualCargoRateSnapshot: numberOrDefault(row.actualCargoRateSnapshot, 0.98),
    status: row.status,
  };
}

function savedItemPayable(item: SheinBatchItemView) {
  return Number(item.totalCustomerPayableBdt ?? savedItemQuotedTotal(item));
}

function savedItemDue(item: SheinBatchItemView) {
  return Number(item.remainingDueBdt ?? Math.max(savedItemPayable(item) - Number(item.advanceReceivedBdt), 0));
}

function savedItemQuotedTotal(item: SheinBatchItemView) {
  return Number(item.customerQuotedPriceBdt) * item.quantity;
}

export function SheinBatchItemsPageClient({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<SheinBatchView | null>(null);
  const [rows, setRows] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadBatch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ batch: SheinBatchView }>(`/api/shein/batches/${batchId}`, {
        cache: "no-store",
        showErrorToast: false,
      });
      setBatch(data.batch);
      setRows((current) => (current.length ? current : [newDraft(data.batch)]));
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void loadBatch();
  }, [loadBatch]);

  const saveableRows = useMemo(() => rows.filter(rowReady), [rows]);
  const isBatchLocked = Boolean(
    batch?.items?.length &&
      batch.items.every((item) => item.status === SheinBatchItemStatus.MOVED_TO_ORDER),
  );

  function updateRow(localId: string, patch: Partial<DraftItem>) {
    setRows((current) =>
      current.map((row) => (row.localId === localId ? { ...row, ...patch } : row)),
    );
  }

  function addRows(count = 1) {
    setRows((current) => [
      ...current,
      ...Array.from({ length: count }, () => newDraft(batch)),
    ]);
  }

  function duplicateLastCustomer() {
    setRows((current) => {
      const previous = current[current.length - 1];
      const next = newDraft(batch);

      if (!previous) {
        return [...current, next];
      }

      return [
        ...current,
        {
          ...next,
          customerName: previous.customerName,
          phone: previous.phone,
          customerSource: previous.customerSource,
          address: previous.address,
        },
      ];
    });
  }

  function removeRow(localId: string) {
    setRows((current) =>
      current.length === 1
        ? [newDraft(batch)]
        : current.filter((row) => row.localId !== localId),
    );
  }

  async function saveRows() {
    if (!saveableRows.length) return;
    setIsSaving(true);
    try {
      const items = [];
      for (const row of saveableRows) {
        const image = row.imageFile ? await uploadSheinImage(row.imageFile) : null;
        items.push(toPayload(row, image?.imageUrl ?? row.imageUrl));
      }
      await apiClient(`/api/shein/batches/${batchId}/items/bulk`, {
        method: "POST",
        body: JSON.stringify({ items }),
        showSuccessToast: true,
      });
      setRows([newDraft(batch)]);
      await loadBatch();
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-3xl border bg-muted" />
        <div className="h-96 animate-pulse rounded-3xl border bg-muted" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            className={cn(
              "mb-2 inline-flex h-7 w-auto items-center justify-center gap-2 text-sm font-medium text-slate-800 hover:text-emerald-700",
            )}
            href="/shein/batches"
          >
            <ArrowLeft className="h-4 w-4" />
            Batches
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {batch?.batchName ?? "SHEIN Batch Items"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage customer product entries for this SHEIN order batch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-10 w-auto gap-2 rounded-lg bg-emerald-700 px-8 hover:bg-emerald-800" disabled={isBatchLocked || !saveableRows.length || isSaving} onClick={saveRows}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving items…" : `Save ${saveableRows.length || ""} Items`}
          </Button>
        </div>
      </div>

      {batch ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid gap-4 px-5 py-4 md:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr]">
            <Metric icon={ClipboardList} label="" value="Batch overview" />
            <Metric icon={Globe2} label="Country" value={`${batch.sourceCountry} / ${batch.currency}`} />
            <Metric icon={CircleDollarSign} label="Bank Rate" value={batch.bankRate ? formatNumber(batch.bankRate) : "Pending"} />
            <Metric icon={Box} label="Saved Items" value={formatNumber(batch.itemCount)} />
            <Metric icon={ClipboardList} label="Notes" value={batch.sheinOrderNumbers || batch.notes || "Not set"} />
          </div>
          <div className="border-t px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PricingRule label="Customer RM rate" value={`${formatNumber(batch.customerRmRate)} / RM`} />
              <PricingRule label="Customer weight rate" value={`${formatNumber(batch.customerWeightRatePerGram)} / g`} />
              <PricingRule label="Actual bank rate" value={batch.bankRate ? formatNumber(batch.bankRate) : "Pending"} />
              <PricingRule label="Actual cargo rate" value={`${formatNumber(batch.actualCargoRatePerGram)} / g`} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 space-y-5">
        {isBatchLocked ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-sm">
            This batch is archived because all its items have been moved to an order. New items can no longer be added.
          </div>
        ) : (
          <DraftItemsEditor rows={rows} onAddRow={() => addRows()} onDuplicateCustomer={duplicateLastCustomer} onImport={() => setIsImportOpen(true)} onRemove={removeRow} onUpdate={updateRow} />
        )}
        <SavedItemsList items={batch?.items ?? []} onAdvanceApplied={loadBatch} />
      </div>
      {batch ? (
        <SheinBulkImportDrawer
          batch={batch}
          onClose={() => setIsImportOpen(false)}
          onSuccess={loadBatch}
          open={isImportOpen}
        />
      ) : null}
    </div>
  );
}

function DraftItemsEditor({
  rows,
  onAddRow,
  onDuplicateCustomer,
  onImport,
  onRemove,
  onUpdate,
}: {
  rows: DraftItem[];
  onAddRow: () => void;
  onDuplicateCustomer: () => void;
  onImport: () => void;
  onRemove: (localId: string) => void;
  onUpdate: (localId: string, patch: Partial<DraftItem>) => void;
}) {
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());

  function toggleRow(localId: string) {
    setCollapsedRows((current) => {
      const next = new Set(current);
      if (next.has(localId)) {
        next.delete(localId);
      } else {
        next.add(localId);
      }
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <h2 className="text-base font-semibold text-slate-950">Customer item drafts</h2>
            <p className="text-sm text-muted-foreground">Create the items that belong to this SHEIN batch.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-9 w-auto gap-2 rounded-lg px-5" onClick={onImport} variant="outline">
            <FileUp className="h-4 w-4" />
            Bulk Import Items
          </Button>
          <Button className="h-9 w-auto gap-2 rounded-lg px-5" onClick={onAddRow} variant="outline">
            <Plus className="h-4 w-4" />
            Add row
          </Button>
          <Button className="h-9 w-auto gap-2 rounded-lg px-5" onClick={onDuplicateCustomer} variant="outline">
            <ClipboardList className="h-4 w-4" />
            Duplicate customer info
          </Button>
        </div>
      </div>

      <div className="grid gap-3 p-3">
        {rows.map((row, index) => {
          const isCollapsed = collapsedRows.has(row.localId);
          return (
            <article className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500/20" key={row.localId}>
              <div className="flex flex-col gap-2 border-b bg-muted/5 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => toggleRow(row.localId)}
                  type="button"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Item draft {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.customerName || "No customer assigned"}{row.sku ? ` · SKU ${row.sku}` : " · No SKU"}
                    </p>
                  </div>
                </button>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    className="h-8 w-8 rounded-lg px-0"
                    onClick={() => toggleRow(row.localId)}
                    type="button"
                    variant="outline"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button className="h-8 w-8 rounded-lg border-transparent px-0 shadow-none hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemove(row.localId)} type="button" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!isCollapsed ? (
              <div className="space-y-3 p-3">
                <section>
                  <SectionTitle icon={Users} title="Customer" />
                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_1fr_1.4fr]">
                    <Field label="Customer name (optional)">
                      <Input value={row.customerName} onChange={(e) => onUpdate(row.localId, { customerName: e.target.value })} placeholder="Customer name" />
                    </Field>
                    <Field label="Phone (optional)">
                      <Input value={row.phone} onChange={(e) => onUpdate(row.localId, { phone: e.target.value })} placeholder="Phone number" />
                    </Field>
                    <Field label="Source (optional)">
                      <Select
                        value={row.customerSource || undefined}
                        onValueChange={(source) => onUpdate(row.localId, { customerSource: source })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(OrderSource).map((source) => (
                            <SelectItem key={source} value={source}>
                              {formatEnum(source)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Address (optional)">
                      <Input value={row.address} onChange={(e) => onUpdate(row.localId, { address: e.target.value })} placeholder="Address optional" />
                    </Field>
                  </div>
                </section>

                <section className="border-t pt-3">
                  <SectionTitle icon={Package} title="Product" />
                  <div className="mt-2 grid gap-3 lg:grid-cols-[118px_minmax(0,1fr)]">
                    <Field label="Product image">
                      <ImageUploadCard row={row} onUpdate={onUpdate} />
                    </Field>
                    <div className="grid content-start gap-2">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.4fr)_minmax(100px,0.7fr)_minmax(100px,0.7fr)_72px_minmax(130px,0.8fr)_minmax(130px,0.8fr)]">
                        <Field label="SKU">
                          <Input value={row.sku} onChange={(e) => onUpdate(row.localId, { sku: e.target.value })} placeholder="sz230..." />
                        </Field>
                        <Field label="Size">
                          <Input value={row.size} onChange={(e) => onUpdate(row.localId, { size: e.target.value })} placeholder="M" />
                        </Field>
                        <Field label="Color">
                          <Input value={row.color} onChange={(e) => onUpdate(row.localId, { color: e.target.value })} placeholder="Black" />
                        </Field>
                        <Field label="Qty">
                          <Input className="px-2 text-center" min="1" type="number" value={row.quantity} onChange={(e) => onUpdate(row.localId, { quantity: e.target.value })} />
                        </Field>
                        <Field label="Buying Price (RM)">
                          <Input type="number" value={row.actualSheinPriceRm} onChange={(e) => onUpdate(row.localId, { actualSheinPriceRm: e.target.value })} placeholder="13.20" />
                        </Field>
                        <Field label="Quote BDT (optional)">
                          <Input min="0" type="number" value={row.customerQuotedPriceBdt} onChange={(e) => onUpdate(row.localId, { customerQuotedPriceBdt: e.target.value })} placeholder="Add later" />
                        </Field>
                      </div>
                      <Field label="SHEIN link">
                        <Input value={row.sheinLink} onChange={(e) => onUpdate(row.localId, { sheinLink: e.target.value })} placeholder="https://..." />
                      </Field>
                    </div>
                  </div>
                </section>
              </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SavedItemsList({
  items,
  onAdvanceApplied,
}: {
  items: SheinBatchItemView[];
  onAdvanceApplied: () => Promise<void>;
}) {
  const [advanceEditorKey, setAdvanceEditorKey] = useState<string | null>(null);
  const [advanceValue, setAdvanceValue] = useState("");
  const [isSavingAdvance, setIsSavingAdvance] = useState(false);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(new Set());
  const groups = useMemo(() => {
    const grouped = new Map<string, SheinBatchItemView[]>();
    for (const item of items) {
      const key = `${item.phone.trim().toLowerCase()}::${item.customerName.trim().toLowerCase()}`;
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return Array.from(grouped.values());
  }, [items]);

  async function saveCustomerAdvance(customer: SheinBatchItemView) {
    setIsSavingAdvance(true);
    try {
      await apiClient("/api/shein/customer-orders/advance", {
        method: "PATCH",
        body: JSON.stringify({
          customerName: customer.customerName,
          phone: customer.phone,
          advanceReceivedBdt: Number(advanceValue || 0),
        }),
        showSuccessToast: true,
      });
      setAdvanceEditorKey(null);
      setAdvanceValue("");
      await onAdvanceApplied();
    } finally {
      setIsSavingAdvance(false);
    }
  }

  function toggleGroup(groupKey: string) {
    setExpandedGroupKeys((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-b-0 bg-card px-4 py-3 shadow-sm">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-semibold text-slate-950">Saved items</h2>
          <span className="text-sm text-muted-foreground">Grouped by customer</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5"><Users className="h-3.5 w-3.5" />{groups.length} Customers</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5"><Package className="h-3.5 w-3.5" />{items.length} Items</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 font-medium text-emerald-700"><CircleDollarSign className="h-3.5 w-3.5" />{formatCurrency(items.reduce((total, item) => total + savedItemPayable(item), 0))} <span className="font-normal text-muted-foreground">Total Payable</span></span>
        </div>
      </div>
      <div className="space-y-3 rounded-b-2xl border bg-card p-3 shadow-sm">
        {groups.map((groupItems) => {
          const first = groupItems[0];
          const groupKey = `${first.phone}-${first.customerName}`;
          const totalQuote = groupItems.reduce((total, item) => total + savedItemQuotedTotal(item), 0);
          const totalAdvance = groupItems.reduce((total, item) => total + Number(item.advanceReceivedBdt), 0);
          const totalDue = groupItems.reduce((total, item) => total + savedItemDue(item), 0);
          const isEditingAdvance = advanceEditorKey === groupKey;
          const isExpanded = expandedGroupKeys.has(groupKey);

          return (
            <div className="overflow-hidden rounded-xl border bg-white" key={groupKey}>
              <div className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[40px_minmax(0,1.2fr)_90px_90px_150px_150px_150px_130px] lg:items-center">
                <Button
                  aria-label={isExpanded ? "Collapse saved items" : "Expand saved items"}
                  className="h-8 w-8 rounded-lg px-0"
                  onClick={() => toggleGroup(groupKey)}
                  type="button"
                  variant="outline"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Users className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{first.customerName || "Unassigned customer"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <p className="text-xs text-muted-foreground">{first.phone || "No phone"}</p>
                      <SheinSourceBadge source={first.customerSource} />
                      <SheinStatusBadge status={first.status} />
                    </div>
                  </div>
                </div>
                <GroupStat label="Items" value={groupItems.length} />
                <GroupStat label="Qty" value={groupItems.reduce((total, item) => total + item.quantity, 0)} />
                <GroupStat label="Quote" value={formatCurrency(totalQuote)} />
                <GroupStat label="Advance" value={formatCurrency(totalAdvance)} />
                <GroupStat label="Due" value={formatCurrency(totalDue)} />
                {first.customerName && first.phone ? (
                  <Button
                    className="h-8 w-fit gap-2 rounded-lg px-3 text-xs"
                    onClick={() => {
                      setAdvanceEditorKey(groupKey);
                      setAdvanceValue(totalAdvance.toFixed(2));
                    }}
                    type="button"
                    variant="outline"
                  >
                    <CircleDollarSign className="h-3.5 w-3.5" />
                    Set advance
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No customer</span>
                )}
              </div>
              {isEditingAdvance ? (
                <div className="flex flex-col gap-2 border-t bg-amber-50/20 px-4 py-3 sm:flex-row sm:items-end sm:justify-end">
                  <Field className="sm:w-56" label="Customer advance">
                    <Input
                      min="0"
                      onChange={(event) => setAdvanceValue(event.target.value)}
                      placeholder="0"
                      type="number"
                      value={advanceValue}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      className="h-9 w-auto rounded-lg px-4"
                      disabled={isSavingAdvance}
                      onClick={() => saveCustomerAdvance(first)}
                      type="button"
                    >
                      {isSavingAdvance ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {isSavingAdvance ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      className="h-9 w-auto rounded-lg px-4"
                      disabled={isSavingAdvance}
                      onClick={() => {
                        setAdvanceEditorKey(null);
                        setAdvanceValue("");
                      }}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              {isExpanded ? (
                <>
                  <div className="hidden grid-cols-[40px_minmax(170px,1fr)_150px_120px_60px_115px_120px_120px_120px] gap-3 border-t bg-slate-50/60 px-4 py-2 text-xs font-semibold text-slate-600 md:grid">
                    <div>#</div><div>Image / SKU</div><div>Product link</div><div>Variant</div><div>Qty</div><div>Quote</div><div>Buying price (RM)</div><div>Buying price (BDT)</div><div>Payable</div>
                  </div>
                  {groupItems.map((item, index) => (
                    <div className="grid gap-2 border-t px-4 py-3 text-sm transition-colors hover:bg-slate-50/60 md:grid-cols-[40px_minmax(170px,1fr)_150px_120px_60px_115px_120px_120px_120px] md:items-center" key={item.id}>
                      <div className="text-xs text-muted-foreground">{index + 1}</div>
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductImageThumb item={item} />
                        <SheinSkuCopy sku={item.sku} />
                      </div>
                      <div>
                        {item.sheinLink ? (
                          <a className="inline-flex items-center gap-1 text-xs font-semibold !text-blue-600 !underline decoration-blue-300 underline-offset-2 hover:!text-blue-800" href={item.sheinLink} rel="noreferrer" target="_blank">
                            View product <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                      <p>{[item.size, item.color].filter(Boolean).join(" / ") || "-"}</p>
                      <p>{item.quantity}</p>
                      <p>{formatCurrency(savedItemQuotedTotal(item))}</p>
                      <p>{item.actualSheinPriceRm ? formatNumber(item.actualSheinPriceRm) : "-"}</p>
                      <p>{item.actualItemCostBdt ? formatCurrency(item.actualItemCostBdt) : "-"}</p>
                      <p>{formatCurrency(savedItemPayable(item))}</p>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          );
        })}
        {!items.length ? <div className="rounded-xl border px-4 py-8 text-center text-sm text-muted-foreground">No saved items yet.</div> : null}
      </div>
    </section>
  );
}

function ImageUploadCard({
  row,
  onUpdate,
}: {
  row: DraftItem;
  onUpdate: (localId: string, patch: Partial<DraftItem>) => void;
}) {
  const previewUrl = row.imagePreviewUrl || row.imageUrl;

  return (
    <div className="flex h-[108px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-2 text-center">
      <label className="flex cursor-pointer flex-col items-center gap-1.5">
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border bg-white text-slate-700">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-full w-full object-cover" src={previewUrl} />
        ) : (
          <CloudUpload className="h-4 w-4" />
        )}
        </span>
        <span className="text-xs font-medium text-slate-800">
            Upload image
        </span>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onUpdate(row.localId, {
              imageFile: file,
              imagePreviewUrl: URL.createObjectURL(file),
            });
            event.target.value = "";
          }}
          type="file"
        />
      </label>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-[10px] text-muted-foreground">Up to 2MB</p>
        {previewUrl ? (
          <button
            className="text-[10px] font-medium text-rose-600 hover:text-rose-700"
            onClick={() => onUpdate(row.localId, { imageFile: null, imagePreviewUrl: null, imageUrl: "" })}
            type="button"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 text-emerald-700">
      <Icon className="h-4 w-4" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("space-y-1", className)}>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="[&_input]:h-8 [&_select]:h-8 [&_textarea]:rounded-lg">
        {children}
      </div>
    </label>
  );
}

function ProductImageThumb({ item }: { item: SheinBatchItemView }) {
  const imageUrl = item.imageUrl || item.screenshotUrl;

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/30 text-muted-foreground">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-full w-full object-cover" src={imageUrl} />
      ) : (
        <Package className="h-4 w-4" />
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        {label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
        <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function PricingRule({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-border/80 px-3 py-1 xl:border-l xl:first:border-l-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function GroupStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-emerald-50/10 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}
