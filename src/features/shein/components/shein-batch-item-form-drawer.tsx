"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  Loader2,
  Package,
  PieChart,
  Save,
  UserRound,
  WalletCards,
} from "lucide-react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { OrderSource, SheinBatchItemStatus } from "@/lib/domain-enums";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import type { SheinBatchItemView, SheinBatchView } from "../types/shein.types";
import { normalizeSheinBatchItemStatus, sheinStatusLabel } from "../utils/shein-status";

type DrawerState =
  | { mode: "create"; batch: SheinBatchView }
  | { mode: "edit"; batch: SheinBatchView; item: SheinBatchItemView }
  | null;

type SheinBatchItemFormState = {
  customerName: string;
  phone: string;
  customerSource: string;
  address: string;
  sku: string;
  sheinLink: string;
  imageUrl: string;
  screenshotUrl: string;
  size: string;
  color: string;
  quantity: string;
  customerQuotedPriceBdt: string;
  advanceReceivedBdt: string;
  actualSheinPriceRm: string;
  bankRateSnapshot: string;
  actualWeightGram: string;
  customerWeightRateSnapshot: string;
  actualCargoRateSnapshot: string;
  status: SheinBatchItemStatus;
};

const blank: SheinBatchItemFormState = {
  customerName: "",
  phone: "",
  customerSource: "",
  address: "",
  sku: "",
  sheinLink: "",
  imageUrl: "",
  screenshotUrl: "",
  size: "",
  color: "",
  quantity: "1",
  customerQuotedPriceBdt: "",
  advanceReceivedBdt: "0",
  actualSheinPriceRm: "",
  bankRateSnapshot: "",
  actualWeightGram: "",
  customerWeightRateSnapshot: "1.25",
  actualCargoRateSnapshot: "0.98",
  status: SheinBatchItemStatus.CONFIRMED,
};

function formStateFromDrawer(drawer: DrawerState): SheinBatchItemFormState {
  if (!drawer) return blank;

  if (drawer.mode === "create") {
    return {
      ...blank,
      bankRateSnapshot: drawer.batch.bankRate ?? "",
      customerWeightRateSnapshot: drawer.batch.customerWeightRatePerGram,
      actualCargoRateSnapshot: drawer.batch.actualCargoRatePerGram,
    };
  }

  return {
    customerName: drawer.item.customerName,
    phone: drawer.item.phone,
    customerSource: drawer.item.customerSource ?? "",
    address: drawer.item.address ?? "",
    sku: drawer.item.sku ?? "",
    sheinLink: drawer.item.sheinLink ?? "",
    imageUrl: drawer.item.imageUrl ?? "",
    screenshotUrl: drawer.item.screenshotUrl ?? "",
    size: drawer.item.size ?? "",
    color: drawer.item.color ?? "",
    quantity: String(drawer.item.quantity),
    customerQuotedPriceBdt: drawer.item.customerQuotedPriceBdt,
    advanceReceivedBdt: drawer.item.advanceReceivedBdt,
    actualSheinPriceRm: drawer.item.actualSheinPriceRm ?? "",
    bankRateSnapshot: drawer.item.bankRateSnapshot ?? "",
    actualWeightGram: drawer.item.actualWeightGram == null ? "" : String(drawer.item.actualWeightGram),
    customerWeightRateSnapshot: drawer.item.customerWeightRateSnapshot,
    actualCargoRateSnapshot: drawer.item.actualCargoRateSnapshot,
    status: normalizeSheinBatchItemStatus(drawer.item.status),
  };
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

export function SheinBatchItemFormDrawer({ drawer, onClose, onSuccess }: { drawer: DrawerState; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(() => formStateFromDrawer(drawer));
  const [isSaving, setIsSaving] = useState(false);

  const summary = useMemo(() => {
    const quantity = Number(form.quantity || 1);
    const quoted = Number(form.customerQuotedPriceBdt || 0) * quantity;
    const advance = Number(form.advanceReceivedBdt || 0);
    const weight = form.actualWeightGram === "" ? null : Number(form.actualWeightGram);
    const rm = form.actualSheinPriceRm === "" ? null : Number(form.actualSheinPriceRm);
    const bank = form.bankRateSnapshot === "" ? null : Number(form.bankRateSnapshot);
    const customerWeightCharge = weight == null ? null : weight * Number(form.customerWeightRateSnapshot || 0);
    const cargo = weight == null ? null : weight * Number(form.actualCargoRateSnapshot || 0);
    const itemCost = rm == null || bank == null ? null : rm * bank * quantity;
    const payable = customerWeightCharge == null ? null : quoted + customerWeightCharge;
    const cost = itemCost == null || cargo == null ? null : itemCost + cargo;
    return { payable, cost, profit: payable != null && cost != null ? payable - cost : null, due: (payable ?? quoted) - advance };
  }, [form]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!drawer) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        productName: "SHEIN item",
        quantity: Math.max(1, Math.trunc(numberOrDefault(form.quantity, 1))),
        customerQuotedPriceBdt: numberOrDefault(form.customerQuotedPriceBdt, 0),
        advanceReceivedBdt: numberOrDefault(form.advanceReceivedBdt, 0),
        actualSheinPriceRm: nullableNumber(form.actualSheinPriceRm),
        bankRateSnapshot: nullableNumber(form.bankRateSnapshot),
        actualWeightGram: nullableNumber(form.actualWeightGram),
        customerWeightRateSnapshot: numberOrDefault(form.customerWeightRateSnapshot, Number(drawer.batch.customerWeightRatePerGram)),
        actualCargoRateSnapshot: numberOrDefault(form.actualCargoRateSnapshot, Number(drawer.batch.actualCargoRatePerGram)),
        status: normalizeSheinBatchItemStatus(form.status),
      };
      await apiClient(drawer.mode === "edit" ? `/api/shein/batch-items/${drawer.item.id}` : `/api/shein/batches/${drawer.batch.id}/items`, {
        method: drawer.mode === "edit" ? "PATCH" : "POST",
        body: JSON.stringify(payload),
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
      className="md:w-[min(820px,100vw)]"
      description="Add customer item details, quote, actual purchase, and cargo weight."
      headerClassName="px-6 py-4"
      onClose={onClose}
      open={drawer !== null}
      title={drawer?.mode === "edit" ? "Edit SHEIN Item" : "Add SHEIN Item"}
    >
      <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-4 px-6 py-5">
          <Section icon={UserRound} title="Customer">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
              <Field label="Customer name (optional)"><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
              <Field label="Phone (optional)"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Source (optional)">
                <Select
                  value={form.customerSource || undefined}
                  onValueChange={(source) => setForm({ ...form, customerSource: source })}
                >
                  <SelectTrigger>
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
            </div>
            <Field label="Address (optional)"><Textarea className="min-h-20" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          </Section>

          <Section icon={Package} title="Product">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_120px]">
              <Field label="SKU"><Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
              <Field label="Size"><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></Field>
              <Field label="Color"><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
              <Field label="Qty"><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="SHEIN link"><Input required value={form.sheinLink} onChange={(e) => setForm({ ...form, sheinLink: e.target.value })} /></Field>
              <Field label="Image URL"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
              <Field label="Screenshot URL"><Input value={form.screenshotUrl} onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })} /></Field>
            </div>
          </Section>

          <Section icon={WalletCards} title="Quote and Cost">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Customer quoted BDT (optional)"><Input min="0" placeholder="Add later" type="number" step="0.01" value={form.customerQuotedPriceBdt} onChange={(e) => setForm({ ...form, customerQuotedPriceBdt: e.target.value })} /></Field>
              <Field label="Advance received"><Input type="number" step="0.01" value={form.advanceReceivedBdt} onChange={(e) => setForm({ ...form, advanceReceivedBdt: e.target.value })} /></Field>
              <Field label="Buying Price (RM)"><Input type="number" step="0.01" value={form.actualSheinPriceRm} onChange={(e) => setForm({ ...form, actualSheinPriceRm: e.target.value })} /></Field>
              <Field label="Bank rate"><Input type="number" step="0.01" value={form.bankRateSnapshot} onChange={(e) => setForm({ ...form, bankRateSnapshot: e.target.value })} /></Field>
              <Field label="Weight gram"><Input type="number" value={form.actualWeightGram} onChange={(e) => setForm({ ...form, actualWeightGram: e.target.value })} /></Field>
              <Field label="Customer weight BDT/g"><Input type="number" step="0.01" value={form.customerWeightRateSnapshot} onChange={(e) => setForm({ ...form, customerWeightRateSnapshot: e.target.value })} /></Field>
              <Field label="Actual cargo BDT/g"><Input type="number" step="0.01" value={form.actualCargoRateSnapshot} onChange={(e) => setForm({ ...form, actualCargoRateSnapshot: e.target.value })} /></Field>
              <Field label="Status">
                <Select
                  key={drawer?.mode === "edit" ? `${drawer.item.id}-${drawer.item.status}` : drawer?.mode ?? "closed"}
                  value={form.status}
                  onValueChange={(status) => setForm({ ...form, status: normalizeSheinBatchItemStatus(status) })}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>{Object.values(SheinBatchItemStatus).map((status) => <SelectItem key={status} value={status}>{sheinStatusLabel(status)}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <section className="space-y-3 border-t pt-3">
            <SectionTitle icon={PieChart} title="Settlement summary" />
            <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm md:grid-cols-4">
              <Summary label="Payable" value={summary.payable == null ? "Pending" : formatCurrency(summary.payable)} />
              <Summary label="Actual cost" value={summary.cost == null ? "Pending" : formatCurrency(summary.cost)} />
              <Summary label="Profit" value={summary.profit == null ? "Pending" : formatCurrency(summary.profit)} />
              <Summary label="Due" value={formatCurrency(summary.due)} />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 grid gap-4 border-t bg-card px-6 py-4 md:grid-cols-2">
          <Button className="h-11 rounded-lg" type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="h-11 rounded-lg bg-emerald-700 hover:bg-emerald-800" disabled={isSaving} type="submit">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </CrudDrawer>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: typeof ClipboardList;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t pt-3 first:border-t-0 first:pt-0">
      <SectionTitle icon={icon} title={title} />
      {children}
    </section>
  );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: typeof ClipboardList }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-700">{label}</Label>{children}</div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-600">{label}</p><p className="font-semibold text-slate-950">{value}</p></div>;
}
