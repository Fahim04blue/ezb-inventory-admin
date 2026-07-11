"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Loader2, Save, Truck, WalletCards } from "lucide-react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PaymentStatus } from "@/lib/domain-enums";
import { formatCurrency } from "@/lib/formatters";
import type { UpdateSheinOrderCostingInput } from "../schemas/order.schema";
import type { OrderView } from "../types/order.types";

type Props = {
  order: OrderView | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (order: OrderView, input: UpdateSheinOrderCostingInput) => Promise<void>;
};

function moneyInputValue(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? String(numericValue) : "0";
}

function stripSheinCostingLines(notes: string | null | undefined) {
  return (notes ?? "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return ![
        /^Total weight:/i,
        /^Weight charge:/i,
        /^Actual weight cost:/i,
        /^COD fee:/i,
        /^Amount to be received:/i,
      ].some((pattern) => pattern.test(trimmed));
    })
    .join("\n")
    .trim();
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "profit" | "loss";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span
        className={
          tone === "profit"
            ? "font-semibold text-emerald-700"
            : tone === "loss"
              ? "font-semibold text-rose-700"
              : "font-semibold text-slate-950"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function SheinOrderCostingDrawer({
  order,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [deliveryCharge, setDeliveryCharge] = useState(() =>
    moneyInputValue(order?.deliveryChargeOnly),
  );
  const [weightCharge, setWeightCharge] = useState(() =>
    moneyInputValue(order?.sheinWeightCharge),
  );
  const [actualWeightCharge, setActualWeightCharge] = useState(() =>
    moneyInputValue(order?.sheinActualWeightCharge),
  );
  const [totalWeightGram, setTotalWeightGram] = useState(() =>
    String(order?.sheinTotalWeightGram ?? 0),
  );
  const [courierFee, setCourierFee] = useState(() =>
    moneyInputValue(order?.courierDeduction),
  );
  const [discount, setDiscount] = useState(() =>
    moneyInputValue(order?.discountAmount),
  );
  const [amountReceived, setAmountReceived] = useState(() =>
    moneyInputValue(order?.amountReceived),
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order?.paymentStatus ?? PaymentStatus.UNPAID,
  );
  const [notes, setNotes] = useState(() => stripSheinCostingLines(order?.notes));

  const summary = useMemo(() => {
    const subtotal = Number(order?.subtotal ?? 0);
    const currentProductCost = Number(order?.productCost ?? 0);
    const currentActualWeightCharge = Number(order?.sheinActualWeightCharge ?? 0);
    const baseBuyingCost = Math.max(currentProductCost - currentActualWeightCharge, 0);
    const delivery = Number(deliveryCharge || 0);
    const customerWeight = Number(weightCharge || 0);
    const actualCargo = Number(actualWeightCharge || 0);
    const cod = Number(courierFee || 0);
    const discountAmount = Number(discount || 0);
    const received = Number(amountReceived || 0);
    const customerPayable = Math.max(subtotal - discountAmount + delivery + customerWeight, 0);
    const totalCost = baseBuyingCost + actualCargo;
    const due = Math.max(customerPayable - received - cod, 0);
    const netProfit = customerPayable - totalCost - cod;

    return {
      subtotal,
      baseBuyingCost,
      delivery,
      customerWeight,
      actualCargo,
      cod,
      discountAmount,
      received,
      customerPayable,
      totalCost,
      due,
      netProfit,
    };
  }, [
    actualWeightCharge,
    amountReceived,
    courierFee,
    deliveryCharge,
    discount,
    order,
    weightCharge,
  ]);

  async function submit() {
    if (!order) {
      return;
    }

    await onSubmit(order, {
      deliveryCharge: Number(deliveryCharge || 0),
      weightCharge: Number(weightCharge || 0),
      actualWeightCharge: Number(actualWeightCharge || 0),
      totalWeightGram: Number(totalWeightGram || 0),
      courierFee: Number(courierFee || 0),
      discount: Number(discount || 0),
      amountReceived: Number(amountReceived || 0),
      paymentStatus,
      notes,
    });
  }

  return (
    <CrudDrawer
      bodyClassName="px-0 py-0"
      className="md:w-[min(680px,100vw)]"
      description={order ? `${order.orderNumber} · ${order.customerName ?? "Walk-in customer"}` : undefined}
      headerClassName="px-6 py-5"
      onClose={onClose}
      open={Boolean(order)}
      title="Edit SHEIN Costing"
    >
      {order ? (
        <div className="flex min-h-full flex-col">
          <div className="flex-1 space-y-5 px-6 py-5 pb-28">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Truck className="h-4 w-4 text-emerald-700" />
                Delivery and Costing
              </div>
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
                <Field label="Customer weight charge">
                  <Input min="0" step="0.01" type="number" value={weightCharge} onChange={(event) => setWeightCharge(event.target.value)} />
                </Field>
                <Field label="Actual weight cost">
                  <Input min="0" step="0.01" type="number" value={actualWeightCharge} onChange={(event) => setActualWeightCharge(event.target.value)} />
                </Field>
                <Field label="Discount">
                  <Input min="0" step="0.01" type="number" value={discount} onChange={(event) => setDiscount(event.target.value)} />
                </Field>
                <Field label="Amount received">
                  <Input min="0" step="0.01" type="number" value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} />
                </Field>
                <Field label="Payment status">
                  <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PaymentStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
                  </Field>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <WalletCards className="h-4 w-4 text-emerald-700" />
                Updated Summary
              </div>
              <div className="space-y-2 rounded-2xl border bg-card p-4 shadow-sm">
                <SummaryRow label="Quote subtotal" value={formatCurrency(summary.subtotal)} />
                <SummaryRow label="Buying cost" value={formatCurrency(summary.baseBuyingCost)} />
                <SummaryRow label="Actual weight cost" value={formatCurrency(summary.actualCargo)} />
                <SummaryRow label="Customer charges" value={formatCurrency(summary.delivery + summary.customerWeight)} />
                <SummaryRow label="COD fee" value={formatCurrency(summary.cod)} />
                <SummaryRow label="Customer payable" value={formatCurrency(summary.customerPayable)} />
                <SummaryRow label="Due after received/COD" value={formatCurrency(summary.due)} tone={summary.due > 0 ? "loss" : "default"} />
                <SummaryRow label="Net profit" value={formatCurrency(summary.netProfit)} tone={summary.netProfit < 0 ? "loss" : "profit"} />
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur">
            <Button className="h-10 rounded-xl" disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button className="h-10 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800" disabled={isSubmitting} onClick={() => void submit()} type="button">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Costing
            </Button>
          </div>
        </div>
      ) : null}
    </CrudDrawer>
  );
}
