"use client";

import { useState } from "react";
import { CurrencyRatesPageHeader } from "./currency-rates-page-header";
import { CurrencyRatesList } from "./currency-rates-list";
import { CurrencyRateFormDrawer } from "./currency-rate-form-drawer";
import { type CurrencyRateView, type ApiSuccess, type ApiError, type DrawerState } from "../types/currency-rate";

export function CurrencyRatesPageClient({
  initialRates,
}: {
  initialRates: CurrencyRateView[];
}) {
  const [currencyRates, setCurrencyRates] = useState<CurrencyRateView[]>(initialRates);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  async function loadRates() {
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
    await loadRates();
  }

  async function handleDrawerSuccess(message: string) {
    setDrawer(null);
    setSuccessMessage(message);
    await loadRates();
  }

  return (
    <div className="space-y-6">
      <CurrencyRatesPageHeader
        onRefresh={() => void loadRates()}
        onAdd={() => setDrawer({ mode: "create" })}
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

      <CurrencyRatesList
        isLoading={isLoading}
        currencyRates={currencyRates}
        onEdit={(currencyRate) => setDrawer({ mode: "edit", currencyRate })}
        onToggleStatus={(currencyRate) => void toggleCurrencyRateStatus(currencyRate)}
      />

      <CurrencyRateFormDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
