"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { OrderSource } from "@prisma/client";

import { apiClient } from "@/lib/api-client";
import { type FinanceFilters } from "@/features/finance/components/finance-filter-bar";
import { SalesSummaryList } from "./sales-summary-list";
import { SalesSummaryFormDrawer } from "./sales-summary-form-drawer";
import { SalesSummaryFilterBar } from "./sales-summary-filter-bar";
import { SalesSummaryPageHeader } from "./sales-summary-page-header";
import { SalesSummaryTotalCard } from "./sales-summary-total-card";
import { type SalesSummaryView, type DrawerState } from "../types/sales-summary.types";

export function SalesSummaryPageClient() {
  const [salesSummaries, setSalesSummaries] = useState<SalesSummaryView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const [filters, setFilters] = useState<FinanceFilters<OrderSource>>({
    search: "",
    category: "ALL",
    date: "ALL",
    status: "ACTIVE",
  });

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await apiClient<{ salesSummaries: SalesSummaryView[] }>("/api/sales-summaries", {
        cache: "no-store",
        showErrorToast: false,
      });

      if (data?.salesSummaries) {
        setSalesSummaries(data.salesSummaries);
      }
    } catch (error) {
      console.error("Failed to load sales summaries:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialSalesSummaries() {
      try {
        const data = await apiClient<{ salesSummaries: SalesSummaryView[] }>(
          "/api/sales-summaries",
          {
            cache: "no-store",
            showErrorToast: false,
          },
        );

        if (!isCancelled && data?.salesSummaries) {
          setSalesSummaries(data.salesSummaries);
        }
      } catch (error) {
        console.error("Failed to load sales summaries:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSalesSummaries();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleToggleStatus(salesSummary: SalesSummaryView) {
    try {
      await apiClient<{ salesSummary: SalesSummaryView }>(`/api/sales-summaries/${salesSummary.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !salesSummary.isActive }),
        showSuccessToast: true,
      });
      loadData();
    } catch (error) {
      console.error("Failed to toggle sales summary status:", error);
    }
  }

  const handleSuccess = () => {
    setDrawer(null);
    loadData(true);
  };

  const handleFilterChange = <K extends keyof FinanceFilters<OrderSource>>(
    key: K,
    value: FinanceFilters<OrderSource>[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ search: "", category: "ALL", date: "ALL", status: "ALL" });
  };

  const filteredSummaries = useMemo(() => {
    return salesSummaries.filter((s) => {
      // Status filter
      if (filters.status === "ACTIVE" && !s.isActive) return false;
      if (filters.status === "INACTIVE" && s.isActive) return false;

      // Source filter
      if (filters.category !== "ALL" && s.source !== filters.category) return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(searchLower);
        const matchesNotes = s.notes?.toLowerCase().includes(searchLower) || false;
        if (!matchesTitle && !matchesNotes) return false;
      }

      // Date filter
      if (filters.date !== "ALL") {
        const sDate = new Date(s.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.date === "TODAY") {
          const startOfToday = new Date(today);
          const endOfToday = new Date(today);
          endOfToday.setHours(23, 59, 59, 999);
          if (sDate < startOfToday || sDate > endOfToday) return false;
        } else if (filters.date === "THIS_WEEK") {
          const dayOfWeek = today.getDay() || 7;
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
          if (sDate < startOfWeek) return false;
        } else if (filters.date === "THIS_MONTH") {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          if (sDate < startOfMonth) return false;
        }
      }

      return true;
    });
  }, [salesSummaries, filters]);

  const currentFilteredActiveSummaries = filteredSummaries.filter(s => s.isActive);
  const totalSalesReceived = currentFilteredActiveSummaries.reduce((sum, s) => sum + Number(s.amountBdt), 0);

  return (
    <div className="w-full min-w-0 space-y-4">
      <SalesSummaryPageHeader
        onAdd={() => setDrawer({ mode: "create" })}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <SalesSummaryTotalCard totalSalesReceived={totalSalesReceived} />

      <SalesSummaryFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <SalesSummaryList
        isLoading={isLoading}
        salesSummaries={filteredSummaries}
        onAdd={() => setDrawer({ mode: "create" })}
        onEdit={(salesSummary) => setDrawer({ mode: "edit", salesSummary })}
        onToggleStatus={handleToggleStatus}
      />

      <SalesSummaryFormDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
