"use client";

import { useState, type ReactNode } from "react";
import {
  Box,
  ExternalLink,
  Package,
  ReceiptText,
  TrendingUp,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { SheinBatchItemView, SheinCustomerOrderGroup } from "../types/shein.types";
import { SheinSkuCopy } from "./shein-sku-copy";
import { SheinSourceBadge } from "./shein-source-badge";
import { SheinStatusBadge } from "./shein-status-badge";

export function SheinCustomerOrderDetailsDrawer({ group, onClose }: { group: SheinCustomerOrderGroup | null; onClose: () => void }) {
  const firstItem = group?.items[0] ?? null;
  const lastUpdated = group?.items.find((item) => item.movedAt)?.movedAt ?? null;
  const summary = group ? getFinancialSummary(group) : null;

  return (
    <CrudDrawer
      bodyClassName="px-0 py-0"
      className="md:w-[min(760px,100vw)]"
      headerClassName="px-6 py-5"
      onClose={onClose}
      open={group !== null}
      title="Customer Order Details"
    >
      {group ? (
        <div className="flex min-h-full flex-col">
          <div className="flex-1 space-y-5 px-6 py-5 pb-24">
            <SheinStatusBadge status={group.status} />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <UserRound className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold text-slate-950">{group.customerName}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-slate-700">{group.phone}</p>
                    <SheinSourceBadge source={group.customerSource} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.address || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={Box} label="Total Items" value={String(group.totalItems)} />
                <InfoCard icon={ReceiptText} label="Total Due" value={formatCurrency(group.totalDue)} />
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-4">
              <SummaryTile icon={Wallet} label="Total Advance" value={formatCurrency(group.totalAdvance)} tone="green" />
              <SummaryTile icon={ReceiptText} label="Total Due" value={formatCurrency(group.totalDue)} tone="red" />
              <SummaryTile icon={Truck} label="Money Spent" value={formatCurrency(group.totalMoneySpent)} tone="violet" />
              <SummaryTile icon={TrendingUp} label={group.profitKind === "ESTIMATED" ? "Est. Profit" : "Final Profit"} value={formatCurrency(group.profitAmount)} tone={Number(group.profitAmount) < 0 ? "red" : "blue"} />
            </div>

            <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-950">Batch Numbers</h3>
              <div className="flex flex-wrap gap-2">
                {group.batches.length ? group.batches.map((batch, index) => <BatchBadge key={`${batch}-${index}`} index={index} label={batch} />) : <span className="text-sm text-muted-foreground">No batches found.</span>}
              </div>
            </section>

            <ItemTable items={group.items} />

            {summary ? (
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-slate-950">Financial Summary</h3>
              <div className="space-y-3">
                <SummaryBox title="Customer collection">
                  <MoneyRow label="Customer quoted product total" value={formatCurrency(summary.productSubtotal)} />
                  <MoneyRow label="Advance received" tone="deduction" value={formatCurrency(summary.advance)} />
                  <MoneyRow label="Product balance after advance" tone="result" value={formatCurrency(summary.remainingProductCost)} />
                  <MoneyRow label="Customer weight charge" value={formatCurrency(summary.customerWeightCharge)} />
                  {summary.deliveryCharge > 0 ? (
                    <MoneyRow label="Delivery charge" value={formatCurrency(summary.deliveryCharge)} />
                  ) : null}
                  <MoneyRow label="Collect from customer" tone="highlight" value={formatCurrency(summary.customerPaysNow)} />
                  {summary.codFee > 0 ? (
                    <MoneyRow label="COD fee deducted" tone="deduction" value={formatCurrency(summary.codFee)} />
                  ) : null}
                  {summary.codFee > 0 ? (
                    <MoneyRow label="Amount receivable after COD" tone="highlight" value={formatCurrency(summary.amountReceivableAfterCod)} />
                  ) : null}
                  <MoneyRow label="Total Customer Bill" tone="result" value={formatCurrency(summary.totalCustomerBill)} />
                </SummaryBox>
                <SummaryBox title="Actual cost">
                  <MoneyRow label="Buying cost in BDT" value={formatCurrency(summary.buyingCostBdt)} />
                  <MoneyRow label="Actual weight/cargo cost" value={formatCurrency(summary.actualWeightCost)} />
                  <MoneyRow label="Total actual cost" tone="result" value={formatCurrency(summary.totalActualCost)} />
                </SummaryBox>
                <SummaryBox title="Profit">
                  <MoneyRow label="Total Customer Bill" value={formatCurrency(summary.totalCustomerBill)} />
                  <MoneyRow label="Actual cost" tone="deduction" value={formatCurrency(summary.totalActualCost)} />
                  {summary.codFee > 0 ? (
                    <MoneyRow label="COD fee" tone="deduction" value={formatCurrency(summary.codFee)} />
                  ) : null}
                  <MoneyRow
                    tone={summary.profit < 0 ? "negative" : "positive"}
                    label={group.profitKind === "ESTIMATED" ? "Estimated net profit" : "Final net profit"}
                    value={formatCurrency(summary.profit)}
                  />
                </SummaryBox>
              </div>
            </section>
            ) : null}

            <section className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-950">Notes</h3>
              <div className="rounded-xl border px-4 py-5 text-sm text-muted-foreground">
                No notes added.
              </div>
            </section>

            <div className="grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
              <DateMeta label="Order Date" value={firstItem?.movedAt ? formatDate(firstItem.movedAt) : "-"} />
              <DateMeta label="Last Updated" value={lastUpdated ? formatDate(lastUpdated) : "-"} />
            </div>
          </div>

          <div className="sticky bottom-0 border-t bg-card px-6 py-4">
            <Button className="h-11 rounded-lg" type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </CrudDrawer>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Box; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, tone }: { icon: typeof Box; label: string; value: string; tone: "green" | "red" | "violet" | "blue" }) {
  const colors = {
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    violet: "bg-violet-100 text-violet-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function ItemTable({ items }: { items: SheinBatchItemView[] }) {
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null);

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-slate-950">Order Items</h3>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid min-w-[620px] grid-cols-[40px_minmax(0,1.4fr)_minmax(0,1fr)_60px_110px_120px] gap-3 border-b px-4 py-3 text-xs font-semibold text-muted-foreground">
          <div>#</div>
          <div>Product</div>
          <div>Details</div>
          <div>Qty</div>
          <div>Price (RM)</div>
          <div>Price (BDT)</div>
        </div>
        <div className="divide-y overflow-x-auto">
          {items.map((item, index) => (
            <div key={item.id} className="grid min-w-[620px] grid-cols-[40px_minmax(0,1.4fr)_minmax(0,1fr)_60px_110px_120px] items-center gap-3 px-4 py-3 text-sm">
              <div>{index + 1}</div>
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumb item={item} onPreview={(url) => setPreview({ url, label: item.sku || item.productName || "SHEIN item" })} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{item.productName}</p>
                  <SheinSkuCopy sku={item.sku} />
                  <p className="text-xs text-muted-foreground">{[item.size, item.color].filter(Boolean).join(" ") || "-"}</p>
                </div>
              </div>
              <div className="min-w-0">
                {item.sheinLink ? (
                  <a className="inline-flex items-center gap-2 text-sm font-medium !text-emerald-700 hover:!text-emerald-800" href={item.sheinLink} rel="noreferrer" target="_blank">
                    View product <ExternalLink className="h-4 w-4" />
                  </a>
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </div>
              <div>{item.quantity}</div>
              <div>
                <p>{item.actualSheinPriceRm ? `RM ${item.actualSheinPriceRm}` : "-"}</p>
                <p className="text-xs text-muted-foreground">{item.bankRateSnapshot ? `(Bank: ${item.bankRateSnapshot})` : ""}</p>
              </div>
              <div className="font-medium">{formatCurrency(item.totalCustomerPayableBdt ?? item.customerQuotedPriceBdt)}</div>
            </div>
          ))}
          {!items.length ? <div className="px-4 py-6 text-center text-sm text-muted-foreground">No order items found.</div> : null}
        </div>
      </div>
      {preview ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-label={`Full image for ${preview.label}`} aria-modal="true">
          <button aria-label="Close image preview" className="absolute inset-0" onClick={() => setPreview(null)} type="button" />
          <div className="relative z-10 flex max-h-[92vh] max-w-[92vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">{preview.label}</p>
              <Button aria-label="Close image preview" className="h-8 w-8 shrink-0 px-0" onClick={() => setPreview(null)} type="button" variant="outline"><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex min-h-0 items-center justify-center bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={preview.label} className="max-h-[80vh] max-w-[88vw] object-contain" src={preview.url} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ProductThumb({ item, onPreview }: { item: SheinBatchItemView; onPreview: (url: string) => void }) {
  const imageUrl = item.imageUrl || item.screenshotUrl;

  return imageUrl ? (
    <button aria-label={`View full image for ${item.sku || item.productName}`} className="flex h-11 w-11 shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground ring-offset-background hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2" onClick={() => onPreview(imageUrl)} type="button">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="h-full w-full object-cover" src={imageUrl} />
    </button>
  ) : (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
      <Package className="h-5 w-5" />
    </div>
  );
}

function MoneyRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "deduction" | "result" | "highlight" | "positive" | "negative";
}) {
  const toneClassName = {
    default: {
      row: "",
      label: "text-slate-700",
      value: "font-medium text-slate-950",
      prefix: "",
    },
    deduction: {
      row: "bg-rose-50/45",
      label: "text-rose-900",
      value: "font-semibold text-rose-700",
      prefix: "- ",
    },
    result: {
      row: "bg-slate-50/80",
      label: "font-medium text-slate-800",
      value: "font-semibold text-slate-950",
      prefix: "",
    },
    highlight: {
      row: "bg-emerald-50/80",
      label: "font-medium text-emerald-950",
      value: "font-semibold text-emerald-800",
      prefix: "",
    },
    positive: {
      row: "bg-emerald-50/80",
      label: "font-medium text-emerald-950",
      value: "font-semibold text-emerald-800",
      prefix: "",
    },
    negative: {
      row: "bg-rose-50/70",
      label: "font-medium text-rose-950",
      value: "font-semibold text-rose-700",
      prefix: "",
    },
  }[tone];

  return (
    <div className={`flex items-center justify-between gap-4 border-b px-4 py-3 text-sm last:border-b-0 ${toneClassName.row}`}>
      <span className={toneClassName.label}>{label}</span>
      <span className={toneClassName.value}>{toneClassName.prefix}{value}</span>
    </div>
  );
}

function SummaryBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3 text-sm font-semibold text-slate-950">
        {title}
      </div>
      {children}
    </div>
  );
}

function getFinancialSummary(group: SheinCustomerOrderGroup) {
  const activeItems = group.items.filter((item) => item.status !== "CANCELLED");
  const sum = (selector: (item: SheinBatchItemView) => number) =>
    activeItems.reduce((total, item) => total + selector(item), 0);
  const productSubtotal = sum((item) => Number(item.customerQuotedPriceBdt) * item.quantity);
  const advance = sum((item) => Number(item.advanceReceivedBdt));
  const itemCustomerWeightCharge = sum((item) => Number(item.customerWeightChargeBdt ?? 0));
  const customerWeightCharge = Math.max(
    Number(group.totalCustomerWeightCharge || 0),
    itemCustomerWeightCharge,
  );
  const buyingCostBdt = sum((item) => Number(item.actualItemCostBdt ?? 0));
  const savedActualWeightCost = sum((item) => Number(item.actualCargoCostBdt ?? 0));
  const totalActualCost = Number(group.totalMoneySpent || 0);
  const actualWeightCost = Math.max(savedActualWeightCost, totalActualCost - buyingCostBdt);
  const deliveryCharge = Number(group.totalDeliveryCharge || 0);
  const codFee = Number(group.totalCodFee || 0);
  const totalCustomerBill = productSubtotal + customerWeightCharge + deliveryCharge;
  const customerPaysNow = Math.max(productSubtotal - advance + customerWeightCharge + deliveryCharge, 0);
  const amountReceivableAfterCod = Math.max(customerPaysNow - codFee, 0);
  const profit = Number(group.profitAmount || 0);

  return {
    productSubtotal,
    advance,
    remainingProductCost: Math.max(productSubtotal - advance, 0),
    customerWeightCharge,
    buyingCostBdt,
    actualWeightCost,
    totalActualCost,
    deliveryCharge,
    codFee,
    totalCustomerBill,
    customerPaysNow,
    amountReceivableAfterCod,
    profit,
  };
}

function DateMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-2 text-slate-700">{value}</p>
    </div>
  );
}

function BatchBadge({ label, index }: { label: string; index: number }) {
  const classes = [
    "border-blue-200 bg-blue-100 text-blue-800",
    "border-emerald-200 bg-emerald-100 text-emerald-800",
    "border-violet-200 bg-violet-100 text-violet-800",
  ];

  return (
    <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${classes[index % classes.length]}`}>
      {label}
    </span>
  );
}
