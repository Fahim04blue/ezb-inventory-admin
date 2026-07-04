"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { SheinBatchStatus } from "@/lib/domain-enums";
import type { SheinBatchView } from "../types/shein.types";

type DrawerState = { mode: "create"; batch?: never } | { mode: "edit"; batch: SheinBatchView } | null;

type SheinBatchFormState = {
  batchName: string;
  sourceCountry: string;
  currency: string;
  customerRmRate: string;
  bankRate: string;
  customerWeightRatePerGram: string;
  actualCargoRatePerGram: string;
  orderDate: string;
  sheinOrderNumbers: string;
  sheinTrackingNumber: string;
  status: SheinBatchStatus;
  notes: string;
};

const initialForm: SheinBatchFormState = {
  batchName: "",
  sourceCountry: "Malaysia",
  currency: "MYR",
  customerRmRate: "33",
  bankRate: "",
  customerWeightRatePerGram: "1.25",
  actualCargoRatePerGram: "0.98",
  orderDate: "",
  sheinOrderNumbers: "",
  sheinTrackingNumber: "",
  status: SheinBatchStatus.CONFIRMED,
  notes: "",
};

export function SheinBatchFormDrawer({
  drawer,
  onClose,
  onSuccess,
}: {
  drawer: DrawerState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!drawer) return;
    if (drawer.mode === "create") {
      setForm(initialForm);
      return;
    }
    setForm({
      batchName: drawer.batch.batchName,
      sourceCountry: drawer.batch.sourceCountry,
      currency: drawer.batch.currency,
      customerRmRate: drawer.batch.customerRmRate,
      bankRate: drawer.batch.bankRate ?? "",
      customerWeightRatePerGram: drawer.batch.customerWeightRatePerGram,
      actualCargoRatePerGram: drawer.batch.actualCargoRatePerGram,
      orderDate: drawer.batch.orderDate ? drawer.batch.orderDate.slice(0, 10) : "",
      sheinOrderNumbers: drawer.batch.sheinOrderNumbers ?? "",
      sheinTrackingNumber: drawer.batch.sheinTrackingNumber ?? "",
      status: drawer.batch.status,
      notes: drawer.batch.notes ?? "",
    });
  }, [drawer]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const body = {
        ...form,
        customerRmRate: Number(form.customerRmRate),
        bankRate: form.bankRate === "" ? null : Number(form.bankRate),
        customerWeightRatePerGram: Number(form.customerWeightRatePerGram),
        actualCargoRatePerGram: Number(form.actualCargoRatePerGram),
        orderDate: form.orderDate || null,
      };
      await apiClient(drawer?.mode === "edit" ? `/api/shein/batches/${drawer.batch.id}` : "/api/shein/batches", {
        method: drawer?.mode === "edit" ? "PATCH" : "POST",
        body: JSON.stringify(body),
        showSuccessToast: true,
      });
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CrudDrawer
      description="Store where and when this SHEIN batch was bought."
      onClose={onClose}
      open={drawer !== null}
      title={drawer?.mode === "edit" ? "Edit SHEIN Batch" : "Create SHEIN Batch"}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Batch name"><Input required value={form.batchName} onChange={(e) => setForm({ ...form, batchName: e.target.value })} /></Field>
          <Field label="Source country"><Input value={form.sourceCountry} onChange={(e) => setForm({ ...form, sourceCountry: e.target.value })} /></Field>
          <Field label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></Field>
          <Field label="Order date"><Input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} /></Field>
          <Field label="Customer RM rate"><Input type="number" step="0.01" value={form.customerRmRate} onChange={(e) => setForm({ ...form, customerRmRate: e.target.value })} /></Field>
          <Field label="Bank rate"><Input type="number" step="0.01" value={form.bankRate} onChange={(e) => setForm({ ...form, bankRate: e.target.value })} /></Field>
          <Field label="Customer weight BDT/g"><Input type="number" step="0.01" value={form.customerWeightRatePerGram} onChange={(e) => setForm({ ...form, customerWeightRatePerGram: e.target.value })} /></Field>
          <Field label="Actual cargo BDT/g"><Input type="number" step="0.01" value={form.actualCargoRatePerGram} onChange={(e) => setForm({ ...form, actualCargoRatePerGram: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as SheinBatchStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.values(SheinBatchStatus).map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SHEIN order number"><Input value={form.sheinOrderNumbers} onChange={(e) => setForm({ ...form, sheinOrderNumbers: e.target.value })} /></Field>
          <Field label="SHEIN tracking number"><Input value={form.sheinTrackingNumber} onChange={(e) => setForm({ ...form, sheinTrackingNumber: e.target.value })} /></Field>
        </div>
        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="sticky bottom-0 -mx-6 flex justify-end gap-3 border-t bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={isSaving} type="submit">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save</Button>
        </div>
      </form>
    </CrudDrawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
