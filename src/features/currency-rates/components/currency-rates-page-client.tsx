"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { CrudPageHeader } from "@/components/common/crud-page-header";
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
  const [drawer, setDrawer] = useState<DrawerState>(null);

  async function loadRates() {
    setIsLoading(true);

    try {
      const data = await apiClient<{ currencyRates: CurrencyRateView[] }>("/api/currency-rates", { cache: "no-store", showErrorToast: false });
      if (data) setCurrencyRates(data.currencyRates);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleCurrencyRateStatus(currencyRate: CurrencyRateView) {
    try {
      await apiClient<{ currencyRate: CurrencyRateView }>(`/api/currency-rates/${currencyRate.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currencyRate.isActive }),
        showSuccessToast: true,
      });
      await loadRates();
    } catch (error) {
      // handled by toast
    }
  }

  async function handleDrawerSuccess(message: string) {
    setDrawer(null);
    await loadRates();
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <CrudPageHeader
        title="Currency Rates"
        description="Manage exchange rates for purchases, cargo, and internal accounting."
        onRefresh={() => void loadRates()}
        isRefreshing={isLoading}
        onAdd={() => setDrawer({ mode: "create" })}
        addLabel="Add Rate"
      />

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
