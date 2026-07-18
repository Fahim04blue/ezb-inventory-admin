"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Loader2,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { SheinBatchStatus } from "@/lib/domain-enums";
import type { SheinBatchItemView, SheinBatchView } from "../types/shein.types";
import { SheinBatchDetailsDrawer } from "./shein-batch-details-drawer";
import { SheinBatchFormDrawer } from "./shein-batch-form-drawer";
import { SheinBatchItemFormDrawer } from "./shein-batch-item-form-drawer";
import { SheinBatchesList } from "./shein-batches-list";
import { canReceiveBatch } from "./shein-batches-table";

type BatchDrawer = { mode: "create" } | { mode: "edit"; batch: SheinBatchView } | null;
type ItemDrawer =
  | { mode: "create"; batch: SheinBatchView }
  | { mode: "edit"; batch: SheinBatchView; item: SheinBatchItemView }
  | null;

export function SheinBatchesPageClient() {
  const router = useRouter();
  const [batches, setBatches] = useState<SheinBatchView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [orderDate, setOrderDate] = useState("");
  const [batchDrawer, setBatchDrawer] = useState<BatchDrawer>(null);
  const [itemDrawer, setItemDrawer] = useState<ItemDrawer>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isMutating, setIsMutating] = useState(false);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await apiClient<{ batches: SheinBatchView[] }>("/api/shein/batches", { cache: "no-store", showErrorToast: false });
      setBatches(data.batches);
      setSelectedBatchIds((currentIds) =>
        currentIds.filter((id) => data.batches.some((batch) => batch.id === id && canReceiveBatch(batch))),
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return batches.filter((batch) => {
      const matchesSearch = !search || [batch.batchName, batch.sheinOrderNumbers, batch.sheinTrackingNumber, batch.sourceCountry].some((value) => value?.toLowerCase().includes(search));
      const matchesDate = !orderDate || batch.orderDate?.slice(0, 10) === orderDate;
      return matchesSearch && matchesDate && (status === "ALL" || batch.status === status);
    });
  }, [batches, orderDate, query, status]);
  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? null;
  const visibleReceivableBatchIds = filtered.filter(canReceiveBatch).map((batch) => batch.id);
  const selectedVisibleReceivableCount = selectedBatchIds.filter((id) => visibleReceivableBatchIds.includes(id)).length;
  const selectedReceivableBatches = filtered.filter((batch) => selectedBatchIds.includes(batch.id) && canReceiveBatch(batch));

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
    setOrderDate("");
  }

  async function deleteBatch(batch: SheinBatchView) {
    if (!confirm(`Delete ${batch.batchName}?`)) return;
    setIsMutating(true);
    try {
      await apiClient(`/api/shein/batches/${batch.id}`, { method: "DELETE", showSuccessToast: true });
      await loadData(true);
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteItem(item: SheinBatchItemView) {
    if (!confirm(`Delete ${item.sku ? `SKU ${item.sku}` : "this item"}?`)) return;
    setIsMutating(true);
    try {
      await apiClient(`/api/shein/batch-items/${item.id}`, { method: "DELETE", showSuccessToast: true });
      await loadData(true);
    } finally {
      setIsMutating(false);
    }
  }

  function batchUpdatePayload(batch: SheinBatchView, status: SheinBatchStatus) {
    return {
      batchName: batch.batchName,
      sourceCountry: batch.sourceCountry,
      currency: batch.currency,
      customerRmRate: Number(batch.customerRmRate),
      bankRate: batch.bankRate === null ? null : Number(batch.bankRate),
      customerWeightRatePerGram: Number(batch.customerWeightRatePerGram),
      actualCargoRatePerGram: Number(batch.actualCargoRatePerGram),
      orderDate: batch.orderDate ? batch.orderDate.slice(0, 10) : null,
      sheinOrderNumbers: batch.sheinOrderNumbers ?? "",
      sheinTrackingNumber: batch.sheinTrackingNumber ?? "",
      status,
      notes: batch.notes ?? "",
    };
  }

  async function markBatchReceived(batch: SheinBatchView, showSuccessToast = true) {
    if (!canReceiveBatch(batch)) return;

    await apiClient(`/api/shein/batches/${batch.id}`, {
      method: "PATCH",
      body: JSON.stringify(batchUpdatePayload(batch, SheinBatchStatus.RECEIVED)),
      showSuccessToast,
    });
  }

  async function handleMarkBatchReceived(batch: SheinBatchView) {
    setIsMutating(true);
    try {
      await markBatchReceived(batch);
      setSelectedBatchIds((currentIds) => currentIds.filter((id) => id !== batch.id));
      await loadData(true);
    } finally {
      setIsMutating(false);
    }
  }

  async function handleBulkMarkReceived() {
    if (!selectedReceivableBatches.length) {
      setSelectedBatchIds([]);
      return;
    }

    setIsMutating(true);
    try {
      await Promise.all(selectedReceivableBatches.map((batch) => markBatchReceived(batch, false)));
      setSelectedBatchIds([]);
      await loadData(true);
    } finally {
      setIsMutating(false);
    }
  }

  function refreshAfterDrawer() {
    setBatchDrawer(null);
    setItemDrawer(null);
    loadData(true);
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">SHEIN Batches</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create purchase batches and track customer SHEIN items.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-10 w-auto gap-2 rounded-lg bg-emerald-700 px-5 hover:bg-emerald-800" onClick={() => setBatchDrawer({ mode: "create" })}>
            <Plus className="h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </div>

      <div className="flex rounded-2xl border bg-card p-3 shadow-sm">
        <Link className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium !text-white shadow-sm hover:!text-white" href="/shein/batches">
          Batches
        </Link>
        <Link className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-muted" href="/shein/customer-orders">
          Customer Orders
        </Link>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_190px_260px_110px] lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-9" placeholder="Search batch name or order number..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10"><SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(SheinBatchStatus).map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-9" type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
        </div>
        <Button className="h-10 w-auto gap-2 rounded-lg px-5" onClick={clearFilters} variant="outline">
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
      {visibleReceivableBatchIds.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-slate-950">{selectedReceivableBatches.length}</span>{" "}
            selected to mark received
          </div>
          <Button
            className="h-9 w-auto gap-2 rounded-lg bg-emerald-700 px-4 text-sm text-white hover:bg-emerald-800"
            disabled={isMutating || selectedReceivableBatches.length === 0}
            onClick={() => void handleBulkMarkReceived()}
            type="button"
          >
            {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            {isMutating ? "Marking received…" : "Mark Selected Received"}
          </Button>
        </div>
      ) : null}
      {isRefreshing && !isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating SHEIN data…
        </div>
      ) : null}
      <SheinBatchesList
        batches={filtered}
        isLoading={isLoading}
        isMutating={isMutating}
        onAddItem={(batch) => router.push(`/shein/batches/${batch.id}/items`)}
        onDelete={deleteBatch}
        onEdit={(batch) => setBatchDrawer({ mode: "edit", batch })}
        onMarkReceived={(batch) => void handleMarkBatchReceived(batch)}
        onSelectAllReceivable={(checked) => {
          setSelectedBatchIds((currentIds) => {
            const currentSet = new Set(currentIds);
            if (checked) {
              visibleReceivableBatchIds.forEach((id) => currentSet.add(id));
            } else {
              visibleReceivableBatchIds.forEach((id) => currentSet.delete(id));
            }
            return Array.from(currentSet);
          });
        }}
        onToggleSelectBatch={(batchId) => {
          setSelectedBatchIds((currentIds) =>
            currentIds.includes(batchId)
              ? currentIds.filter((id) => id !== batchId)
              : [...currentIds, batchId],
          );
        }}
        onView={(batch) => setSelectedBatchId(batch.id)}
        selectedBatchIds={selectedBatchIds}
        selectedVisibleReceivableCount={selectedVisibleReceivableCount}
        visibleReceivableBatchCount={visibleReceivableBatchIds.length}
      />
      <SheinBatchFormDrawer
        key={batchDrawer?.mode === "edit" ? `batch-${batchDrawer.batch.id}-${batchDrawer.batch.status}` : `batch-${batchDrawer?.mode ?? "closed"}`}
        drawer={batchDrawer}
        onClose={() => setBatchDrawer(null)}
        onSuccess={refreshAfterDrawer}
      />
      <SheinBatchDetailsDrawer batch={selectedBatch} isMutating={isMutating} onClose={() => setSelectedBatchId(null)} onAddItem={(batch) => router.push(`/shein/batches/${batch.id}/items`)} onEditItem={(batch, item) => setItemDrawer({ mode: "edit", batch, item })} onDeleteItem={deleteItem} />
      <SheinBatchItemFormDrawer key={itemDrawer?.mode === "edit" ? `item-${itemDrawer.item.id}-${itemDrawer.item.status}` : `item-${itemDrawer?.mode ?? "closed"}`} drawer={itemDrawer} onClose={() => setItemDrawer(null)} onSuccess={refreshAfterDrawer} />
    </div>
  );
}
