"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Currency, CurrencyRateType } from "@prisma/client";
import { Edit, Plus, Power, RefreshCw } from "lucide-react";

import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CrudDrawer } from "@/components/common/crud-drawer";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import {
  createCurrencyRateSchema,
  type CreateCurrencyRateInput,
} from "@/features/currency-rates/schemas/currency-rate-schemas";

export type CurrencyRateView = {
  id: number;
  currency: Currency;
  rateType: CurrencyRateType;
  rateToBdt: string;
  effectiveDate: string;
  country: string | null;
  source: string | null;
  note: string | null;
  isActive: boolean;
};

type ApiSuccess<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

type ApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

type DrawerState =
  | { mode: "create" }
  | { mode: "edit"; currencyRate: CurrencyRateView }
  | null;

function CurrencyRateForm({
  mode,
  currencyRate,
  onSuccess,
}: {
  mode: "create" | "edit";
  currencyRate?: CurrencyRateView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createCurrencyRateSchema),
    defaultValues: {
      currency: currencyRate?.currency ?? Currency.BDT,
      rateType: currencyRate?.rateType ?? CurrencyRateType.CARD_PURCHASE,
      rateToBdt: currencyRate?.rateToBdt ?? "",
      effectiveDate: currencyRate ? new Date(currencyRate.effectiveDate) : new Date(),
      country: currencyRate?.country ?? "",
      source: currencyRate?.source ?? "",
      note: currencyRate?.note ?? "",
      isActive: currencyRate?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateCurrencyRateInput) {
    setSubmitError(null);
    const response = await fetch(
      mode === "create"
        ? "/api/currency-rates"
        : `/api/currency-rates/${currencyRate?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          effectiveDate:
            values.effectiveDate instanceof Date
              ? values.effectiveDate.toISOString()
              : values.effectiveDate,
        }),
      },
    );

    const payload = (await response.json()) as
      | ApiSuccess<{ currencyRate: CurrencyRateView }>
      | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to save currency rate.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Currency</Label>
          <select className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" {...form.register("currency")}>
            {Object.values(Currency).map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Rate Type</Label>
          <select className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" {...form.register("rateType")}>
            {Object.values(CurrencyRateType).map((rateType) => (
              <option key={rateType} value={rateType}>
                {rateType}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Rate to BDT</Label>
          <Input {...form.register("rateToBdt")} />
        </div>
        <div className="space-y-2">
          <Label>Effective Date</Label>
          <Input type="date" {...form.register("effectiveDate", { valueAsDate: true })} />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input {...form.register("country")} />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <Input {...form.register("source")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Note</Label>
        <Textarea {...form.register("note")} />
      </div>
      <div className="flex items-end gap-2">
        <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
        <Label>Active</Label>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting
          ? "Saving..."
          : mode === "create"
            ? "Create Currency Rate"
            : "Save Currency Rate"}
      </Button>
    </form>
  );
}

export function CurrencyRatesPageClient({
  initialCurrencyRates,
}: {
  initialCurrencyRates: CurrencyRateView[];
}) {
  const [currencyRates, setCurrencyRates] = useState<CurrencyRateView[]>(initialCurrencyRates);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  async function loadCurrencyRates() {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/currency-rates", {
      credentials: "include",
      cache: "no-store",
    });
    const payload = (await response.json()) as
      | ApiSuccess<{ currencyRates: CurrencyRateView[] }>
      | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to load currency rates.");
      setIsLoading(false);
      return;
    }

    setCurrencyRates(payload.data.currencyRates);
    setIsLoading(false);
  }

  async function toggleCurrencyRateStatus(currencyRate: CurrencyRateView) {
    const response = await fetch(`/api/currency-rates/${currencyRate.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !currencyRate.isActive }),
    });
    const payload = (await response.json()) as
      | ApiSuccess<{ currencyRate: CurrencyRateView }>
      | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to update currency rate status.");
      return;
    }

    setSuccessMessage(payload.message);
    await loadCurrencyRates();
  }

  async function handleDrawerSuccess(message: string) {
    setDrawer(null);
    setSuccessMessage(message);
    await loadCurrencyRates();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currency Rates"
        description="List currency rates first and manage CARD_PURCHASE and CARGO_PAYMENT rates through the same drawer pattern."
        actions={
          <>
            <Button
              className="w-auto px-4"
              onClick={() => void loadCurrencyRates()}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "create" })}>
              <Plus className="mr-2 h-4 w-4" />
              Add Currency Rate
            </Button>
          </>
        }
      />

      {successMessage ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <>
          <TableSkeleton columns={5} rows={6} />
          <CardListSkeleton cards={4} />
        </>
      ) : currencyRates.length === 0 ? (
        <Card>
          <CardContent className="pt-8">
            <p className="text-sm text-muted-foreground">
              No currency rates yet. Click Add Currency Rate to create the first one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
            <div className="grid grid-cols-[0.9fr_1.1fr_0.9fr_1fr_0.9fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
              <div>Currency</div>
              <div>Rate Type</div>
              <div>Rate to BDT</div>
              <div>Effective / Country</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-border">
              {currencyRates.map((currencyRate) => (
                <div className="grid grid-cols-[0.9fr_1.1fr_0.9fr_1fr_0.9fr] gap-4 px-6 py-5" key={currencyRate.id}>
                  <div>
                    <p className="font-semibold">{currencyRate.currency}</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${currencyRate.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                      {currencyRate.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{currencyRate.rateType}</div>
                  <div className="text-sm text-muted-foreground">{currencyRate.rateToBdt}</div>
                  <div className="text-sm text-muted-foreground">
                    <p>{formatDate(currencyRate.effectiveDate)}</p>
                    <p className="mt-1">{currencyRate.country || "No country"}</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "edit", currencyRate })} variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button className="w-auto px-4" onClick={() => void toggleCurrencyRateStatus(currencyRate)} variant="outline">
                      <Power className="mr-2 h-4 w-4" />
                      {currencyRate.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:hidden">
            {currencyRates.map((currencyRate) => (
              <Card key={currencyRate.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{currencyRate.currency}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{currencyRate.rateType}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currencyRate.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                      {currencyRate.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>Rate to BDT: {currencyRate.rateToBdt}</p>
                    <p>Effective: {formatDate(currencyRate.effectiveDate)}</p>
                    <p>Country: {currencyRate.country || "Not set"}</p>
                    <p>Source: {currencyRate.source || "Not set"}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "edit", currencyRate })} variant="outline">
                      Edit
                    </Button>
                    <Button className="w-auto px-4" onClick={() => void toggleCurrencyRateStatus(currencyRate)} variant="outline">
                      {currencyRate.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <CrudDrawer
        description={
          drawer?.mode === "create"
            ? "Add a reusable exchange rate."
            : "Edit an existing exchange rate."
        }
        onClose={() => setDrawer(null)}
        open={drawer !== null}
        title={drawer?.mode === "create" ? "Add Currency Rate" : "Edit Currency Rate"}
      >
        {drawer?.mode === "create" ? (
          <CurrencyRateForm mode="create" onSuccess={handleDrawerSuccess} />
        ) : null}
        {drawer?.mode === "edit" ? (
          <CurrencyRateForm
            currencyRate={drawer.currencyRate}
            mode="edit"
            onSuccess={handleDrawerSuccess}
          />
        ) : null}
      </CrudDrawer>
    </div>
  );
}
