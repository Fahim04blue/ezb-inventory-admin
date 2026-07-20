"use client";

import { Loader2, UserRound, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { OrderSource } from "@/lib/domain-enums";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import type { SheinBatchItemView } from "../types/shein.types";

type CustomerPreset = Pick<SheinBatchItemView, "customerName" | "phone" | "customerSource" | "address">;

export function SheinCustomerAssignmentDrawer({
  items,
  customerPresets,
  onClose,
  onSuccess,
  open,
}: {
  items: SheinBatchItemView[];
  customerPresets: CustomerPreset[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
  open: boolean;
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerSource, setCustomerSource] = useState("");
  const [address, setAddress] = useState("");
  const [advance, setAdvance] = useState("0");
  const [isSaving, setIsSaving] = useState(false);
  const totalPayable = useMemo(
    () => items.reduce((total, item) => total + Number(item.totalCustomerPayableBdt ?? Number(item.customerQuotedPriceBdt) * item.quantity), 0),
    [items],
  );
  const advanceAmount = Number(advance || 0);
  const isAdvanceInvalid = !Number.isFinite(advanceAmount) || advanceAmount < 0 || advanceAmount > totalPayable;

  function resetAndClose() {
    setCustomerName("");
    setPhone("");
    setCustomerSource("");
    setAddress("");
    setAdvance("0");
    onClose();
  }

  function applyPreset(value: string) {
    const preset = customerPresets[Number(value)];
    if (!preset) return;
    setCustomerName(preset.customerName);
    setPhone(preset.phone);
    setCustomerSource(preset.customerSource ?? "");
    setAddress(preset.address ?? "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerName.trim() || isAdvanceInvalid || !items.length) return;
    setIsSaving(true);
    try {
      await apiClient("/api/shein/batch-items/assign-customer", {
        method: "PATCH",
        body: JSON.stringify({
          itemIds: items.map((item) => item.id),
          customerName,
          phone,
          customerSource,
          address,
          advanceReceivedBdt: advanceAmount,
        }),
        showSuccessToast: true,
      });
      await onSuccess();
      resetAndClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CrudDrawer
      className="md:w-[min(560px,100vw)]"
      description={`${items.length} selected ${items.length === 1 ? "item" : "items"}`}
      onClose={resetAndClose}
      open={open}
      title="Assign Customer"
    >
      <form className="space-y-6" onSubmit={submit}>
        {customerPresets.length ? (
          <div className="space-y-2">
            <Label>Use a customer already in this batch</Label>
            <Select onValueChange={applyPreset}>
              <SelectTrigger><SelectValue placeholder="Select existing customer" /></SelectTrigger>
              <SelectContent>
                {customerPresets.map((preset, index) => (
                  <SelectItem key={`${preset.phone}-${preset.customerName}`} value={String(index)}>
                    {preset.customerName} · {preset.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <section className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-emerald-700" />Customer information</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name *"><Input autoFocus onChange={(event) => setCustomerName(event.target.value)} required value={customerName} /></Field>
            <Field label="Phone (optional)"><Input onChange={(event) => setPhone(event.target.value)} value={phone} /></Field>
          </div>
          <Field label="Source">
            <Select value={customerSource || undefined} onValueChange={setCustomerSource}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>{Object.values(OrderSource).map((source) => <SelectItem key={source} value={source}>{formatEnum(source)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Address (optional)"><Textarea onChange={(event) => setAddress(event.target.value)} rows={3} value={address} /></Field>
        </section>

        <section className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
          <div className="flex items-center gap-2 font-semibold"><WalletCards className="h-4 w-4 text-emerald-700" />Customer payment</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Summary label="Selected items" value={String(items.length)} />
            <Summary label="Total payable" value={formatCurrency(totalPayable)} />
          </div>
          <Field label="Advance received for these items">
            <Input max={totalPayable} min="0" onChange={(event) => setAdvance(event.target.value)} step="0.01" type="number" value={advance} />
          </Field>
          {isAdvanceInvalid ? <p className="text-sm text-destructive">Advance cannot exceed {formatCurrency(totalPayable)}.</p> : null}
          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Remaining due</span>
            <strong>{formatCurrency(Math.max(totalPayable - (Number.isFinite(advanceAmount) ? advanceAmount : 0), 0))}</strong>
          </div>
        </section>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button disabled={isSaving} onClick={resetAndClose} type="button" variant="outline">Cancel</Button>
          <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800" disabled={isSaving || isAdvanceInvalid || !customerName.trim()} type="submit">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Assigning…" : `Assign ${items.length} ${items.length === 1 ? "Item" : "Items"}`}
          </Button>
        </div>
      </form>
    </CrudDrawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
