"use client";

import { useMemo, useState } from "react";
import { Loader2, Package, Plus, Save, Truck, WalletCards } from "lucide-react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { PaymentStatus } from "@/lib/domain-enums";
import { formatCurrency } from "@/lib/formatters";
import type { SheinBatchItemView, SheinCustomerOrderGroup } from "../types/shein.types";
import { SheinSkuCopy } from "./shein-sku-copy";

export function SheinCustomerOrderCreateDrawer({
  group,
  onClose,
  onSuccess,
  onCostingUpdated,
}: {
  group: SheinCustomerOrderGroup | null;
  onClose: () => void;
  onSuccess: () => void;
  onCostingUpdated?: () => void;
}) {
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [courierFee, setCourierFee] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [totalWeightGram, setTotalWeightGram] = useState(() => initialTotalWeightGram(group));
  const [weightCharge, setWeightCharge] = useState(() => initialWeightCharge(group));
  const [isWeightChargeEdited, setIsWeightChargeEdited] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [notes, setNotes] = useState("Created from SHEIN customer order");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingCosting, setIsUpdatingCosting] = useState(false);

  const arrivedItems = useMemo(
    () => group?.items.filter((item) => item.status === "RECEIVED" && !item.movedToOrderId) ?? [],
    [group],
  );

  const summary = useMemo(() => {
    const productSubtotal = arrivedItems.reduce(
      (sum, item) => sum + Number(item.customerQuotedPriceBdt) * item.quantity,
      0,
    );
    const advance = arrivedItems.reduce((sum, item) => sum + Number(item.advanceReceivedBdt), 0);
    const buyingCostBdt = arrivedItems.reduce((sum, item) => sum + Number(item.actualItemCostBdt ?? 0), 0);
    const delivery = Number(deliveryCharge || 0);
    const codFee = Number(courierFee || 0);
    const discountAmount = Number(discount || 0);
    const weightGram = Number(totalWeightGram || 0);
    const weightRate = Number(arrivedItems[0]?.customerWeightRateSnapshot ?? 0);
    const actualWeightRate = Number(arrivedItems[0]?.actualCargoRateSnapshot ?? 0);
    const customerWeightCharge = Number(weightCharge || 0);
    const actualWeightCost = weightGram * actualWeightRate;
    const productCost = buyingCostBdt + actualWeightCost;
    const remainingProductCost = Math.max(productSubtotal - advance - discountAmount, 0);
    const finalCustomerBill = Math.max(productSubtotal - discountAmount + customerWeightCharge + delivery, 0);
    const customerPaysNow = Math.max(remainingProductCost + customerWeightCharge + delivery, 0);
    const amountToBeReceived = Math.max(customerPaysNow - codFee, 0);
    const estimatedProfit = finalCustomerBill - productCost - codFee;

    return { productSubtotal, advance, remainingProductCost, weightGram, weightRate, actualWeightRate, weightCharge: customerWeightCharge, delivery, codFee, discountAmount, customerPaysNow, amountToBeReceived, totalCustomerBill: finalCustomerBill, buyingCostBdt, actualWeightCost, productCost, estimatedProfit };
  }, [arrivedItems, courierFee, deliveryCharge, discount, totalWeightGram, weightCharge]);

  async function createOrder() {
    if (!group || !arrivedItems.length) return;
    setIsSaving(true);
    try {
      await apiClient("/api/shein/customer-orders/create-normal-order", {
        method: "POST",
        body: JSON.stringify({
          phone: group.phone,
          itemIds: arrivedItems.map((item) => item.id),
          deliveryCharge: Number(deliveryCharge || 0),
          weightCharge: summary.weightCharge,
          actualWeightCharge: summary.actualWeightCost,
          totalWeightGram: summary.weightGram,
          courierFee: Number(courierFee || 0),
          discount: Number(discount || 0),
          amountReceived: summary.amountToBeReceived,
          paymentStatus,
          notes,
        }),
        showSuccessToast: true,
      });
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  async function updateCosting() {
    if (!group || !arrivedItems.length) return;
    setIsUpdatingCosting(true);
    try {
      await apiClient("/api/shein/customer-orders/update-costing", {
        method: "PATCH",
        body: JSON.stringify({
          phone: group.phone,
          itemIds: arrivedItems.map((item) => item.id),
          weightCharge: summary.weightCharge,
          totalWeightGram: summary.weightGram,
        }),
        showSuccessToast: true,
      });
      onCostingUpdated?.();
    } finally {
      setIsUpdatingCosting(false);
    }
  }

  return (
    <CrudDrawer
      bodyClassName="px-0 py-0"
      className="md:w-[min(720px,100vw)]"
      description={group ? `${group.customerName} · ${arrivedItems.length} ready item${arrivedItems.length === 1 ? "" : "s"}` : undefined}
      headerClassName="px-6 py-5"
      hideCloseButton
      onClose={onClose}
      open={group !== null}
      title="Create Order"
    >
      {group ? (
        <div className="flex min-h-full flex-col">
          <div className="flex-1 space-y-5 px-6 py-5 pb-24">
            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Package className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-950">{group.customerName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{group.phone}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.address || "-"}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle icon={Package} title="Ready Items" />
              <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
                {arrivedItems.map((item) => <ReadyItemRow key={item.id} item={item} />)}
                {!arrivedItems.length ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No received SHEIN items are ready to create an order.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle icon={Truck} title="Delivery and Payment" />
              <div className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2">
                <Field label="Delivery charge collected">
                  <Input min="0" step="0.01" type="number" value={deliveryCharge} onChange={(event) => setDeliveryCharge(event.target.value)} />
                </Field>
                <Field label="COD fee">
                  <Input min="0" step="0.01" type="number" value={courierFee} onChange={(event) => setCourierFee(event.target.value)} />
                </Field>
                <Field label="Total weight (g)">
                  <Input
                    min="0"
                    step="1"
                    type="number"
                    value={totalWeightGram}
                    onChange={(event) => {
                      const nextWeightGram = event.target.value;
                      setTotalWeightGram(nextWeightGram);
                      if (!isWeightChargeEdited) {
                        setWeightCharge(autoWeightCharge(arrivedItems, nextWeightGram));
                      }
                    }}
                  />
                </Field>
                <Field label={`Weight charge (${summary.weightRate.toFixed(4)} BDT/g)`}>
                  <Input
                    min="0"
                    step="0.01"
                    type="number"
                    value={weightCharge}
                    onChange={(event) => {
                      setIsWeightChargeEdited(true);
                      setWeightCharge(event.target.value);
                    }}
                  />
                </Field>
                <Field label={`Actual weight cost (${summary.actualWeightRate.toFixed(4)} BDT/g)`}>
                  <Input readOnly value={formatCurrency(summary.actualWeightCost)} />
                </Field>
                <Field label="Discount">
                  <Input min="0" step="0.01" type="number" value={discount} onChange={(event) => setDiscount(event.target.value)} />
                </Field>
                <Field label="Amount To be Received">
                  <Input className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-800" readOnly value={formatCurrency(summary.amountToBeReceived)} />
                </Field>
                <Field label="Payment status">
                  <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.values(PaymentStatus).map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <Textarea className="min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} />
                  </Field>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle icon={WalletCards} title="Order Summary" />
              <div className="space-y-3">
                <SummaryBox title="Customer collection">
                  <MoneyRow label="Customer quoted product total" value={formatCurrency(summary.productSubtotal)} />
                  <MoneyRow label="Advance received" tone="deduction" value={formatCurrency(summary.advance)} />
                  <MoneyRow label="Product balance after advance" tone="result" value={formatCurrency(summary.remainingProductCost)} />
                  <MoneyRow label="Customer weight charge" value={formatCurrency(summary.weightCharge)} />
                  {summary.delivery > 0 ? (
                    <MoneyRow label="Delivery charge" value={formatCurrency(summary.delivery)} />
                  ) : null}
                  {summary.discountAmount > 0 ? (
                    <MoneyRow label="Discount" tone="deduction" value={formatCurrency(summary.discountAmount)} />
                  ) : null}
                  <MoneyRow label="Collect from customer" tone="highlight" value={formatCurrency(summary.customerPaysNow)} />
                  {summary.codFee > 0 ? (
                    <MoneyRow label="COD fee deducted" tone="deduction" value={formatCurrency(summary.codFee)} />
                  ) : null}
                  {summary.codFee > 0 ? (
                    <MoneyRow label="Amount receivable after COD" tone="highlight" value={formatCurrency(summary.amountToBeReceived)} />
                  ) : null}
                  <MoneyRow label="Total Customer Bill" tone="result" value={formatCurrency(summary.totalCustomerBill)} />
                </SummaryBox>
                <SummaryBox title="Actual cost">
                  <MoneyRow label="Buying cost in BDT" value={formatCurrency(summary.buyingCostBdt)} />
                  <MoneyRow label={`Actual weight charge (${summary.weightGram || 0}g × ${summary.actualWeightRate.toFixed(4)})`} value={formatCurrency(summary.actualWeightCost)} />
                  <MoneyRow label="Total actual cost" tone="result" value={formatCurrency(summary.productCost)} />
                </SummaryBox>
                <SummaryBox title="Profit">
                  <MoneyRow label="Total Customer Bill" value={formatCurrency(summary.totalCustomerBill)} />
                  <MoneyRow label="Actual cost" tone="deduction" value={formatCurrency(summary.productCost)} />
                  {summary.codFee > 0 ? (
                    <MoneyRow label="COD fee" tone="deduction" value={formatCurrency(summary.codFee)} />
                  ) : null}
                  <MoneyRow label="Estimated net profit" tone={summary.estimatedProfit < 0 ? "negative" : "positive"} value={formatCurrency(summary.estimatedProfit)} />
                </SummaryBox>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 grid gap-3 border-t bg-card px-6 py-4 sm:grid-cols-[1fr_1.1fr]">
            <Button
              className="h-11 rounded-lg border-amber-200 bg-amber-50 font-semibold text-amber-800 shadow-sm hover:bg-amber-100 hover:text-amber-900"
              disabled={!arrivedItems.length || isSaving || isUpdatingCosting}
              type="button"
              variant="outline"
              onClick={updateCosting}
            >
              {isUpdatingCosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Update Weight/Costing
            </Button>
            <Button className="h-11 rounded-lg bg-emerald-700 hover:bg-emerald-800" disabled={!arrivedItems.length || isSaving || isUpdatingCosting} onClick={createOrder}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Order
            </Button>
          </div>
        </div>
      ) : null}
    </CrudDrawer>
  );
}

function initialTotalWeightGram(group: SheinCustomerOrderGroup | null) {
  const defaultWeight = group?.items
    .filter((item) => item.status === "RECEIVED" && !item.movedToOrderId)
    .reduce((sum, item) => sum + (item.actualWeightGram ?? 0), 0) ?? 0;

  return defaultWeight > 0 ? String(defaultWeight) : "";
}

function initialWeightCharge(group: SheinCustomerOrderGroup | null) {
  const arrivedItems = group?.items.filter((item) => item.status === "RECEIVED" && !item.movedToOrderId) ?? [];
  const charge = arrivedItems.reduce(
    (sum, item) => sum + Number(item.customerWeightChargeBdt ?? 0),
    0,
  );

  return charge > 0 ? charge.toFixed(2) : "0";
}

function autoWeightCharge(items: SheinBatchItemView[], totalWeightGram: string) {
  const weightGram = Number(totalWeightGram || 0);
  const weightRate = Number(items[0]?.customerWeightRateSnapshot ?? 0);
  const charge = weightGram > 0 && weightRate > 0 ? weightGram * weightRate : 0;

  return charge > 0 ? charge.toFixed(2) : "0";
}

function ReadyItemRow({ item }: { item: SheinBatchItemView }) {
  const quotedTotal = Number(item.customerQuotedPriceBdt) * item.quantity;
  const buyingBdt = Number(item.actualItemCostBdt ?? 0);
  const actualCargoBdt = Number(item.actualCargoCostBdt ?? 0);
  const totalCostBdt = Number(item.totalActualCostBdt ?? buyingBdt + actualCargoBdt);

  return (
    <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_72px_115px_115px_115px] sm:items-center">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">{item.productName}</p>
        <SheinSkuCopy sku={item.sku} />
        <p className="text-xs text-muted-foreground">{[item.size, item.color, item.batchName].filter(Boolean).join(" · ") || "-"}</p>
      </div>
      <div className="text-muted-foreground">Qty {item.quantity}</div>
      <MiniAmount label="Quote" value={formatCurrency(quotedTotal)} />
      <MiniAmount label="Buy RM" value={item.actualSheinPriceRm ? `RM ${item.actualSheinPriceRm}` : "-"} />
      <MiniAmount label="Buy BDT" value={formatCurrency(buyingBdt)} detail={actualCargoBdt > 0 ? `+ ${formatCurrency(actualCargoBdt)} weight = ${formatCurrency(totalCostBdt)}` : undefined} />
    </div>
  );
}

function MiniAmount({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-slate-950">{value}</p>
      {detail ? <p className="text-[11px] leading-tight text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Package; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">{label}</Label>{children}</div>;
}

function SummaryBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold text-slate-950">{title}</div>
      {children}
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
