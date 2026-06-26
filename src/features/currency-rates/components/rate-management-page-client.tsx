"use client";

import { useMemo, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { CrudPageHeader } from "@/components/common/crud-page-header";
import { apiClient } from "@/lib/api-client";
import { formatEnum } from "@/lib/formatters";
import { RateTypeForm } from "@/features/product-options/components/rate-type-form";
import type { RateTypeView } from "@/features/rate-types/types/rate-type";
import type { CurrencyRateView, DrawerState } from "../types/currency-rate";
import { filterRateHistory, getActiveRates, toRateManagementViews } from "../utils/rate-management";
import { ActiveRatesList } from "./active-rates-list";
import { CurrencyRateFormDrawer } from "./currency-rate-form-drawer";
import { RateHistoryFilters } from "./rate-history-filters";
import { RateHistoryList } from "./rate-history-list";
import { RateManagementTabs, type RateManagementTab } from "./rate-management-tabs";
import { RateTypesTab } from "./rate-types-tab";

const emptyFilters = {
  search: "",
  rateType: "",
  currency: "",
  country: "",
  status: "",
  date: "",
};

export function RateManagementPageClient({
  initialRates,
  initialRateTypes,
}: {
  initialRates: CurrencyRateView[];
  initialRateTypes: RateTypeView[];
}) {
  const [currencyRates, setCurrencyRates] = useState(initialRates);
  const [rateTypes, setRateTypes] = useState(initialRateTypes);
  const [activeTab, setActiveTab] = useState<RateManagementTab>("active-rates");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [rateDrawer, setRateDrawer] = useState<DrawerState>(null);
  const [rateTypeDrawer, setRateTypeDrawer] = useState<
    | { mode: "create" }
    | { mode: "edit"; item: RateTypeView }
    | null
  >(null);

  const managedRates = useMemo(
    () => toRateManagementViews(currencyRates),
    [currencyRates],
  );
  const activeRates = useMemo(
    () => getActiveRates(managedRates),
    [managedRates],
  );
  const filteredHistoryRates = useMemo(
    () => filterRateHistory(managedRates, filters),
    [managedRates, filters],
  );

  const filterOptions = useMemo(
    () => ({
      rateTypes: Array.from(new Set(managedRates.map((rate) => formatEnum(rate.rateType)))),
      currencies: Array.from(new Set(managedRates.map((rate) => rate.currency))),
      countries: Array.from(
        new Set(
          managedRates
            .map((rate) => rate.country?.trim())
            .filter((country): country is string => Boolean(country)),
        ),
      ),
    }),
    [managedRates],
  );

  async function loadData() {
    setIsLoading(true);

    try {
      const [ratesData, rateTypesData] = await Promise.all([
        apiClient<{ currencyRates: CurrencyRateView[] }>("/api/currency-rates", {
          cache: "no-store",
          showErrorToast: false,
        }),
        apiClient<{ rateTypes: RateTypeView[] }>("/api/rate-types", {
          cache: "no-store",
          showErrorToast: false,
        }),
      ]);

      setCurrencyRates(ratesData.currencyRates);
      setRateTypes(rateTypesData.rateTypes);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleCurrencyRateStatus(currencyRate: CurrencyRateView) {
    await apiClient<{ currencyRate: CurrencyRateView }>(
      `/api/currency-rates/${currencyRate.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currencyRate.isActive }),
        showSuccessToast: true,
      },
    );

    await loadData();
  }

  async function toggleRateTypeStatus(rateType: RateTypeView) {
    await apiClient<{ rateType: RateTypeView }>(`/api/rate-types/${rateType.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !rateType.isActive }),
      showSuccessToast: true,
    });

    await loadData();
  }

  async function handleRateSuccess() {
    setRateDrawer(null);
    await loadData();
  }

  async function handleRateTypeSuccess() {
    setRateTypeDrawer(null);
    await loadData();
  }

  const addLabel =
    activeTab === "rate-types" ? "Add Rate Type" : "Add Rate";

  return (
    <div className="w-full min-w-0 space-y-6">
      <CrudPageHeader
        title="Rate Management"
        description="Manage current business rates, historical rates, and reusable rate types."
        addLabel={addLabel}
        isRefreshing={isLoading}
        onAdd={() =>
          activeTab === "rate-types"
            ? setRateTypeDrawer({ mode: "create" })
            : setRateDrawer({ mode: "create" })
        }
        onRefresh={() => void loadData()}
      />

      <RateManagementTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "active-rates" ? (
        <ActiveRatesList
          isLoading={isLoading}
          onCreateNewRate={(rate) =>
            setRateDrawer({ mode: "create", initialCurrencyRate: rate })
          }
          onEdit={(rate) => setRateDrawer({ mode: "edit", currencyRate: rate })}
          onToggleStatus={(rate) => void toggleCurrencyRateStatus(rate)}
          rates={activeRates}
        />
      ) : null}

      {activeTab === "rate-history" ? (
        <div className="space-y-4">
          <RateHistoryFilters
            countries={filterOptions.countries}
            currencies={filterOptions.currencies}
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(emptyFilters)}
            rateTypes={filterOptions.rateTypes}
          />
          <RateHistoryList
            isLoading={isLoading}
            onCreateNewRate={(rate) =>
              setRateDrawer({ mode: "create", initialCurrencyRate: rate })
            }
            onEdit={(rate) => setRateDrawer({ mode: "edit", currencyRate: rate })}
            onToggleStatus={(rate) => void toggleCurrencyRateStatus(rate)}
            rates={filteredHistoryRates}
          />
        </div>
      ) : null}

      {activeTab === "rate-types" ? (
        <RateTypesTab
          isLoading={isLoading}
          onEdit={(rateType) => setRateTypeDrawer({ mode: "edit", item: rateType })}
          onToggleStatus={(rateType) => void toggleRateTypeStatus(rateType)}
          rateTypes={rateTypes}
        />
      ) : null}

      <CurrencyRateFormDrawer
        drawer={rateDrawer}
        onClose={() => setRateDrawer(null)}
        onSuccess={handleRateSuccess}
      />

      <CrudDrawer
        description={
          rateTypeDrawer?.mode === "create"
            ? "Create a reusable rate type label."
            : "Update a reusable rate type label."
        }
        onClose={() => setRateTypeDrawer(null)}
        open={rateTypeDrawer !== null}
        title={rateTypeDrawer?.mode === "create" ? "Add Rate Type" : "Edit Rate Type"}
      >
        {rateTypeDrawer?.mode === "create" ? (
          <RateTypeForm mode="create" onSuccess={handleRateTypeSuccess} />
        ) : null}
        {rateTypeDrawer?.mode === "edit" ? (
          <RateTypeForm
            mode="edit"
            onSuccess={handleRateTypeSuccess}
            rateType={rateTypeDrawer.item}
          />
        ) : null}
      </CrudDrawer>
    </div>
  );
}
