"use client";

import { Check, Loader2, UserRound, WalletCards, X } from "lucide-react";
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
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [customerSuggestion, setCustomerSuggestion] = useState<CustomerPreset | null>(null);
  const [dismissedPhone, setDismissedPhone] = useState("");
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
    setCustomerSuggestion(null);
    setDismissedPhone("");
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

  function useCustomerSuggestion() {
    if (!customerSuggestion) return;
    setCustomerName(customerSuggestion.customerName);
    setPhone(customerSuggestion.phone);
    setCustomerSource(customerSuggestion.customerSource ?? "");
    setAddress(customerSuggestion.address ?? "");
    setCustomerSuggestion(null);
  }

  async function lookupCustomer() {
    const lookupPhone = phone.trim();
    if (!lookupPhone || lookupPhone === dismissedPhone) return;
    setIsLookingUpCustomer(true);
    try {
      const data = await apiClient<{ customer: CustomerPreset | null }>(`/api/shein/customers/lookup?phone=${encodeURIComponent(lookupPhone)}`, {
        cache: "no-store",
        showErrorToast: false,
      });
      if (phone.trim() === lookupPhone) setCustomerSuggestion(data.customer);
    } catch {
      setCustomerSuggestion(null);
    } finally {
      setIsLookingUpCustomer(false);
    }
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
            <Field label="Phone (optional)">
              <div className="relative">
                <Input onBlur={() => void lookupCustomer()} onChange={(event) => { setPhone(event.target.value); setCustomerSuggestion(null); setDismissedPhone(""); }} value={phone} />
                {isLookingUpCustomer ? <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
              </div>
            </Field>
          </div>
          {customerSuggestion ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="text-sm font-semibold text-emerald-900">Returning customer found</p>
              <p className="mt-1 text-sm text-emerald-800">{customerSuggestion.customerName} · {customerSuggestion.phone}</p>
              {customerSuggestion.address ? <p className="mt-1 line-clamp-2 text-xs text-emerald-700">{customerSuggestion.address}</p> : null}
              <p className="mt-2 text-xs text-emerald-700">Would you like to fill this customer&apos;s saved information?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="h-8 w-auto gap-2 bg-emerald-700 px-3 text-xs hover:bg-emerald-800" onClick={useCustomerSuggestion} type="button"><Check className="h-3.5 w-3.5" />Use customer info</Button>
                <Button className="h-8 w-auto gap-2 px-3 text-xs" onClick={() => { setDismissedPhone(phone.trim()); setCustomerSuggestion(null); }} type="button" variant="outline"><X className="h-3.5 w-3.5" />Not now</Button>
              </div>
            </div>
          ) : null}
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
