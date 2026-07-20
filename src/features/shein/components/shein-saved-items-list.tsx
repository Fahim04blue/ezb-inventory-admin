"use client";

import { ChevronDown, ChevronRight, ExternalLink, RotateCw, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { SheinBatchItemStatus } from "@/lib/domain-enums";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SheinBatchItemView } from "../types/shein.types";
import { SheinCustomerAssignmentDrawer } from "./shein-customer-assignment-drawer";
import { SheinSkuCopy } from "./shein-sku-copy";
import { SheinSourceBadge } from "./shein-source-badge";
import { SheinStatusBadge } from "./shein-status-badge";

function payable(item: SheinBatchItemView) {
  return Number(item.totalCustomerPayableBdt ?? Number(item.customerQuotedPriceBdt) * item.quantity);
}

function isAssigned(item: SheinBatchItemView) {
  return Boolean(item.customerName.trim());
}

function canAssign(item: SheinBatchItemView) {
  return item.status !== SheinBatchItemStatus.MOVED_TO_ORDER && item.status !== SheinBatchItemStatus.CANCELLED;
}

export function SheinSavedItemsList({ items, onRefresh }: { items: SheinBatchItemView[]; onRefresh: () => Promise<void> }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [savingAdvanceKey, setSavingAdvanceKey] = useState<string | null>(null);
  const [advanceDrafts, setAdvanceDrafts] = useState<Record<string, string>>({});
  const unassigned = items.filter((item) => !isAssigned(item));
  const assigned = items.filter(isAssigned);
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const selectedAssignedItems = selectedItems.filter(isAssigned);
  const groups = useMemo(() => {
    const result = new Map<string, SheinBatchItemView[]>();
    for (const item of assigned) {
      const key = `${item.phone.trim().toLowerCase()}::${item.customerName.trim().toLowerCase()}`;
      result.set(key, [...(result.get(key) ?? []), item]);
    }
    return Array.from(result.entries());
  }, [assigned]);
  const presets = groups.map(([, group]) => group[0]);

  function toggleItem(itemId: string) {
    setSelectedIds((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  }

  function toggleAllUnassigned(checked: boolean) {
    const eligibleIds = unassigned.filter(canAssign).map((item) => item.id);
    setSelectedIds((current) => checked ? Array.from(new Set([...current, ...eligibleIds])) : current.filter((id) => !eligibleIds.includes(id)));
  }

  function toggleGroupItems(group: SheinBatchItemView[], checked: boolean) {
    const eligibleIds = group.filter(canAssign).map((item) => item.id);
    setSelectedIds((current) => checked ? Array.from(new Set([...current, ...eligibleIds])) : current.filter((id) => !eligibleIds.includes(id)));
  }

  async function saveAdvance(key: string, first: SheinBatchItemView) {
    setSavingAdvanceKey(key);
    try {
      await apiClient("/api/shein/customer-orders/advance", {
        method: "PATCH",
        body: JSON.stringify({ customerName: first.customerName, phone: first.phone, advanceReceivedBdt: Number(advanceDrafts[key] || 0) }),
        showSuccessToast: true,
      });
      await onRefresh();
    } finally {
      setSavingAdvanceKey(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold">Saved items</h2><p className="text-sm text-muted-foreground">Assign customers after products have been added to the batch.</p></div>
        <div className="flex gap-2 text-xs"><Stat value={`${unassigned.length} Unassigned`} /><Stat value={`${groups.length} Customers`} /><Stat value={`${items.length} Items`} /></div>
      </div>

      {unassigned.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div><h3 className="text-lg font-semibold text-slate-900">Unassigned Items ({unassigned.length})</h3><p className="mt-1 text-sm text-muted-foreground">These items are not grouped until customer information is added.</p></div>
            </div>
            <Button className="h-9 w-fit self-end gap-2 px-4 text-sm bg-emerald-700 hover:bg-emerald-800" disabled={!selectedItems.length} onClick={() => setIsDrawerOpen(true)}><UserPlus className="h-4 w-4" />Assign Customer ({selectedItems.length})</Button>
          </div>
          <div className="border-t">
            <div className="hidden grid-cols-[44px_minmax(260px,1.5fr)_150px_170px_160px_70px_150px_150px] items-center gap-4 bg-slate-50/70 px-5 py-3 text-xs font-medium text-slate-500 lg:grid">
              <input aria-label="Select all unassigned items" checked={unassigned.filter(canAssign).every((item) => selectedIds.includes(item.id))} className="h-4 w-4 accent-emerald-700" onChange={(event) => toggleAllUnassigned(event.target.checked)} type="checkbox" />
              <span>Product</span><span>Status</span><span>Action</span><span>Variant</span><span>Qty</span><span>Quote</span><span>Payable</span>
            </div>
            <div className="divide-y">
              {unassigned.map((item) => <AssignedItemRow item={item} key={item.id} onToggle={() => toggleItem(item.id)} selected={selectedIds.includes(item.id)} />)}
            </div>
          </div>
        </div>
      ) : items.length ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm text-emerald-800">All saved items have customer information.</div>
      ) : null}

      {groups.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-xl font-semibold tracking-tight text-slate-900">Assigned Customer Orders</h3><p className="mt-1 text-sm text-muted-foreground">Items are grouped by customer name and phone.</p></div>
            <Button className="h-9 w-fit self-end gap-2 bg-emerald-700 px-4 text-sm hover:bg-emerald-800" disabled={!selectedAssignedItems.length} onClick={() => setIsDrawerOpen(true)}><UserPlus className="h-4 w-4" />Reassign Customer ({selectedAssignedItems.length})</Button>
          </div>
          {groups.map(([key, group]) => {
            const first = group[0];
            const expanded = !expandedGroups.has(key);
            const total = group.reduce((sum, item) => sum + payable(item), 0);
            const advance = group.reduce((sum, item) => sum + Number(item.advanceReceivedBdt), 0);
            return (
              <div className="border-t border-slate-200 bg-card" key={key}>
                <div className="flex flex-col gap-5 px-5 py-5 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Button className="h-10 w-10 shrink-0 rounded-lg px-0" onClick={() => setExpandedGroups((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; })} variant="outline">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">{customerInitials(first.customerName)}</span>
                    <div className="min-w-0"><p className="truncate text-lg font-semibold text-slate-900">{first.customerName}</p><div className="mt-1 flex flex-wrap items-center gap-2">{first.phone ? <span className="text-xs text-muted-foreground">{first.phone}</span> : null}<SheinSourceBadge source={first.customerSource} /></div></div>
                  </div>
                  <div className="grid flex-[1.35] grid-cols-2 gap-y-4 sm:grid-cols-4 xl:grid-cols-[90px_1fr_1fr_1fr_minmax(200px,1.15fr)]">
                    <SummaryMetric accent label="Items" value={String(group.length)} />
                    <SummaryMetric label="Payable" value={formatCurrency(total)} />
                    <SummaryMetric label="Advance" value={formatCurrency(advance)} />
                    <SummaryMetric label="Due" value={formatCurrency(Math.max(total - advance, 0))} />
                    <div className="col-span-2 flex items-end gap-2 border-slate-200 sm:col-span-4 xl:col-span-1 xl:border-l xl:pl-7"><label className="min-w-0 flex-1 space-y-1 text-xs text-muted-foreground">Update advance<input className="block h-11 w-full rounded-lg border bg-background px-3 text-sm font-medium text-foreground shadow-sm" max={total} min="0" onChange={(event) => setAdvanceDrafts((current) => ({ ...current, [key]: event.target.value }))} step="0.01" type="number" value={advanceDrafts[key] ?? advance.toFixed(2)} /></label><Button aria-label={`Save advance for ${first.customerName}`} className="h-11 w-11 shrink-0 px-0" disabled={savingAdvanceKey === key} onClick={() => saveAdvance(key, first)} variant="outline"><RotateCw className={cn("h-4 w-4", savingAdvanceKey === key && "animate-spin")} /></Button></div>
                  </div>
                </div>
                {expanded ? (
                  <div className="border-t">
                    <div className="hidden grid-cols-[44px_minmax(260px,1.5fr)_150px_170px_160px_70px_150px_150px] items-center gap-4 bg-slate-50/70 px-5 py-3 text-xs font-medium text-slate-500 lg:grid">
                      <input aria-label={`Select all items for ${first.customerName}`} checked={group.filter(canAssign).every((item) => selectedIds.includes(item.id))} className="h-4 w-4 accent-emerald-700" onChange={(event) => toggleGroupItems(group, event.target.checked)} type="checkbox" />
                      <span>Product</span><span>Status</span><span>Action</span><span>Variant</span><span>Qty</span><span>Quote</span><span>Payable</span>
                    </div>
                    <div className="divide-y">{group.map((item) => <AssignedItemRow item={item} key={item.id} onToggle={() => toggleItem(item.id)} selected={selectedIds.includes(item.id)} />)}</div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {!items.length ? <div className="rounded-2xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">No saved items yet.</div> : null}
      <SheinCustomerAssignmentDrawer customerPresets={presets} items={selectedItems} onClose={() => setIsDrawerOpen(false)} onSuccess={async () => { setSelectedIds([]); await onRefresh(); }} open={isDrawerOpen} />
    </section>
  );
}

function AssignedItemRow({ item, selected, onToggle }: { item: SheinBatchItemView; selected: boolean; onToggle: () => void }) {
  return (
    <div className={cn("grid gap-3 px-5 py-3.5 text-sm transition-colors lg:grid-cols-[44px_minmax(260px,1.5fr)_150px_170px_160px_70px_150px_150px] lg:items-center", selected ? "bg-emerald-50/70" : "hover:bg-slate-50/70")}>
      <input aria-label={`Select ${item.sku ?? "SHEIN item"}`} checked={selected} className="h-4 w-4 accent-emerald-700" disabled={!canAssign(item)} onChange={onToggle} type="checkbox" />
      <div className="flex min-w-0 items-center gap-4"><Thumbnail item={item} /><SheinSkuCopy className="text-sm text-slate-800" sku={item.sku} /></div>
      <div><SheinStatusBadge className="bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" status={item.status} /></div>
      <div>{item.sheinLink ? <a className="inline-flex items-center gap-2 text-sm font-medium !text-emerald-700 hover:!text-emerald-800" href={item.sheinLink} rel="noreferrer" target="_blank">View product <ExternalLink className="h-4 w-4" /></a> : <span className="text-muted-foreground">-</span>}</div>
      <span>{[item.size, item.color].filter(Boolean).join(" / ") || "-"}</span><span>{item.quantity}</span><span>{formatCurrency(Number(item.customerQuotedPriceBdt) * item.quantity)}</span><span>{formatCurrency(payable(item))}</span>
    </div>
  );
}

function Thumbnail({ item }: { item: SheinBatchItemView }) {
  const src = item.imageUrl || item.screenshotUrl;
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-xs text-muted-foreground">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-full w-full object-cover" src={src} />
      ) : "No image"}
    </span>
  );
}

function customerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "?"}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""}`.toUpperCase();
}

function SummaryMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="border-slate-200 px-3 sm:border-l sm:px-5"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("mt-1 whitespace-nowrap font-semibold text-slate-900", accent && "text-emerald-700")}>{value}</p></div>;
}

function Stat({ value }: { value: string }) { return <span className="rounded-lg border bg-background px-3 py-1.5">{value}</span>; }
