"use client";

import { useMemo, useState } from "react";
import { Loader2, Package, Plus, Truck, WalletCards } from "lucide-react";

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
}: {
  group: SheinCustomerOrderGroup | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [courierFee, setCourierFee] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [totalWeightGram, setTotalWeightGram] = useState(() => initialTotalWeightGram(group));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [notes, setNotes] = useState("Created from SHEIN customer order");
  const [isSaving, setIsSaving] = useState(false);

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
    const weightCharge = weightGram * weightRate;
    const actualWeightCost = weightGram * actualWeightRate;
    const productCost = buyingCostBdt + actualWeightCost;
    const remainingProductCost = Math.max(productSubtotal - advance - discountAmount, 0);
    const customerPayable = Math.max(productSubtotal - discountAmount + weightCharge + delivery, 0);
    const amountToBeReceived = Math.max(remainingProductCost + weightCharge + delivery - codFee, 0);
    const estimatedProfit = customerPayable - productCost - codFee;

    return { productSubtotal, advance, remainingProductCost, weightGram, weightRate, actualWeightRate, weightCharge, delivery, codFee, discountAmount, amountToBeReceived, customerPayable, buyingCostBdt, actualWeightCost, productCost, estimatedProfit };
  }, [arrivedItems, courierFee, deliveryCharge, discount, totalWeightGram]);

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

  return (
    <CrudDrawer
      bodyClassName="px-0 py-0"
      className="md:w-[min(720px,100vw)]"
      description={group ? `${group.customerName} · ${arrivedItems.length} ready item${arrivedItems.length === 1 ? "" : "s"}` : undefined}
      headerClassName="px-6 py-5"
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
                  <Input min="0" step="1" type="number" value={totalWeightGram} onChange={(event) => setTotalWeightGram(event.target.value)} />
                </Field>
                <Field label={`Weight charge (${summary.weightRate.toFixed(4)} BDT/g)`}>
                  <Input readOnly value={formatCurrency(summary.weightCharge)} />
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
                  <MoneyRow label="Advance received" value={`-${formatCurrency(summary.advance)}`} />
                  <MoneyRow label="Remaining product cost" value={formatCurrency(summary.remainingProductCost)} />
                  <MoneyRow label="Customer weight charge" value={formatCurrency(summary.weightCharge)} />
                  <MoneyRow label="Delivery charge" value={formatCurrency(summary.delivery)} />
                  <MoneyRow label="Discount" value={`-${formatCurrency(summary.discountAmount)}`} />
                  <MoneyRow label="COD fee deducted" value={`-${formatCurrency(summary.codFee)}`} />
                  <MoneyRow highlight label="Amount To be Received" value={formatCurrency(summary.amountToBeReceived)} />
                  <MoneyRow label="Total customer payable" strong value={formatCurrency(summary.customerPayable)} />
                </SummaryBox>
                <SummaryBox title="Actual cost">
                  <MoneyRow label="Buying cost in BDT" value={formatCurrency(summary.buyingCostBdt)} />
                  <MoneyRow label={`Actual weight charge (${summary.weightGram || 0}g × ${summary.actualWeightRate.toFixed(4)})`} value={formatCurrency(summary.actualWeightCost)} />
                  <MoneyRow label="COD fee" value={formatCurrency(summary.codFee)} />
                  <MoneyRow label="Total actual cost" strong value={formatCurrency(summary.productCost + summary.codFee)} />
                </SummaryBox>
                <SummaryBox title="Profit">
                  <MoneyRow label="Customer payable" value={formatCurrency(summary.customerPayable)} />
                  <MoneyRow label="Actual cost + COD fee" value={`-${formatCurrency(summary.productCost + summary.codFee)}`} />
                  <MoneyRow label="Estimated net profit" strong value={formatCurrency(summary.estimatedProfit)} />
                </SummaryBox>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 grid gap-4 border-t bg-card px-6 py-4 sm:grid-cols-2">
            <Button className="h-11 rounded-lg" type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button className="h-11 rounded-lg bg-emerald-700 hover:bg-emerald-800" disabled={!arrivedItems.length || isSaving} onClick={createOrder}>
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
  strong = false,
  danger = false,
  highlight = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  const isNegative = value.trim().startsWith("-");
  const valueClassName = danger || isNegative
    ? "font-semibold text-red-600"
    : highlight
      ? "font-semibold text-emerald-800"
      : strong
        ? "font-semibold text-slate-950"
        : "font-medium text-slate-950";

  return (
    <div className={`flex items-center justify-between gap-4 border-b px-4 py-3 text-sm last:border-b-0 ${highlight ? "bg-emerald-50/80" : ""}`}>
      <span className={highlight ? "font-medium text-emerald-900" : "text-slate-700"}>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}
