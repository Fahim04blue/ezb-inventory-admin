"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { TableSkeleton } from "@/components/common/table-skeleton";
import { apiClient } from "@/lib/api-client";
import { StockAdjustmentDrawer } from "./stock-adjustment-drawer";
import { StockFilterBar } from "./stock-filter-bar";
import { StockHistoryDrawer } from "./stock-history-drawer";
import { StockMobileView } from "./stock-mobile-view";
import { StockOverviewTable } from "./stock-overview-table";
import { StockPagination } from "./stock-pagination";
import { StockPageHeader } from "./stock-page-header";
import { StockSummaryCards } from "./stock-summary-cards";
import type {
  StockAdjustmentDrawerState,
  StockFilters,
  StockOverviewItem,
  StockOverviewResponse,
} from "../types/stock.types";

const DEFAULT_FILTERS: StockFilters = {
  search: "",
  productId: "ALL",
  status: "ALL",
  trend: "ALL",
  sort: "NEEDS_ATTENTION",
};

function StockLoadingState() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <TableSkeleton columns={8} rows={6} />
    </div>
  );
}

const EMPTY_STOCK_DATA: StockOverviewResponse = {
  summary: {
    totalUnits: 0,
    stockValue: "0",
    lowStockItems: 0,
    recentAdjustments: 0,
  },
  items: [],
  variantOptions: [],
  recentMovements: [],
};

export function StockPageClient() {
  const [stockData, setStockData] =
    useState<StockOverviewResponse>(EMPTY_STOCK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawer, setDrawer] = useState<StockAdjustmentDrawerState>(null);
  const [historyVariant, setHistoryVariant] = useState<StockOverviewItem | null>(null);
  const [filters, setFilters] = useState<StockFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await apiClient<StockOverviewResponse>("/api/stock", {
        cache: "no-store",
        showErrorToast: false,
      });

      if (data) {
        setStockData(data);
      }
    } catch (error) {
      console.error("Failed to load stock:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialStock() {
      try {
        const data = await apiClient<StockOverviewResponse>("/api/stock", {
          cache: "no-store",
          showErrorToast: false,
        });

        if (!isCancelled && data) {
          setStockData(data);
        }
      } catch (error) {
        console.error("Failed to load stock:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialStock();

    return () => {
      isCancelled = true;
    };
  }, []);

  function handleFilterChange<K extends keyof StockFilters>(
    key: K,
    value: StockFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }

  function handleRowsPerPageChange(value: number) {
    setRowsPerPage(value);
    setCurrentPage(1);
  }

  async function handleTogglePriority(variant: StockOverviewItem) {
    try {
      await apiClient<{ variant: { id: number; isPriority: boolean } }>(
        `/api/product-variants/${variant.id}/priority`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isPriority: !variant.isPriority,
            priorityNote: variant.priorityNote,
            priorityRank: variant.priorityRank,
          }),
          showSuccessToast: true,
        },
      );
      loadData(true);
    } catch (error) {
      console.error("Failed to update product priority:", error);
    }
  }

  const filteredItems = useMemo(() => {
    return stockData.items.filter((item) => {
      if (
        filters.productId !== "ALL" &&
        item.productId !== Number(filters.productId)
      ) {
        return false;
      }

      if (filters.status === "LOW_STOCK") {
        if (item.lowStockAlert == null || item.currentStock > item.lowStockAlert) {
          return false;
        }
      }

      if (filters.status === "IN_STOCK" && item.currentStock <= 0) {
        return false;
      }

      if (filters.status === "OUT_OF_STOCK" && item.currentStock !== 0) {
        return false;
      }

      if (filters.trend === "PRIORITY" && !item.isPriority) {
        return false;
      }

      if (
        filters.trend !== "ALL" &&
        filters.trend !== "PRIORITY" &&
        item.salesTrend !== filters.trend
      ) {
        return false;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        const haystack = [
          item.productName,
          item.name,
          item.sku,
          item.brandName,
          item.categoryName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    }).sort((first, second) => {
      if (filters.sort === "PRIORITY_FIRST") {
        return (
          Number(second.isPriority) - Number(first.isPriority) ||
          (first.priorityRank ?? Number.MAX_SAFE_INTEGER) -
            (second.priorityRank ?? Number.MAX_SAFE_INTEGER) ||
          second.stockPriorityScore - first.stockPriorityScore ||
          first.productName.localeCompare(second.productName) ||
          first.name.localeCompare(second.name)
        );
      }

      if (filters.sort === "STOCK_HIGH_TO_LOW") {
        return (
          second.currentStock - first.currentStock ||
          first.productName.localeCompare(second.productName) ||
          first.name.localeCompare(second.name)
        );
      }

      if (filters.sort === "STOCK_LOW_TO_HIGH") {
        return (
          first.currentStock - second.currentStock ||
          first.productName.localeCompare(second.productName) ||
          first.name.localeCompare(second.name)
        );
      }

      if (filters.sort === "NAME_A_Z") {
        return (
          first.productName.localeCompare(second.productName) ||
          first.name.localeCompare(second.name)
        );
      }

      if (filters.sort === "RECENTLY_UPDATED") {
        return (
          new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime() ||
          first.productName.localeCompare(second.productName) ||
          first.name.localeCompare(second.name)
        );
      }

      return (
        second.stockPriorityScore - first.stockPriorityScore ||
        Number(second.currentStock > 0) - Number(first.currentStock > 0) ||
        Number(second.isPriority) - Number(first.isPriority) ||
        first.productName.localeCompare(second.productName) ||
        first.name.localeCompare(second.name)
      );
    });
  }, [filters, stockData.items]);

  const productOptions = useMemo(() => {
    const products = new Map<number, string>();

    stockData.items.forEach((item) => {
      products.set(item.productId, item.productName);
    });

    return Array.from(products.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [stockData.items]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, rowsPerPage, safeCurrentPage]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <StockMobileView
        filters={filters}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        items={paginatedItems}
        currentPage={safeCurrentPage}
        onAdd={() => setDrawer({ mode: "create", adjustmentType: "OPENING_STOCK" })}
        onAdjust={(variant) =>
          setDrawer({
            mode: "create",
            variant,
            adjustmentType:
              variant.currentStock === 0 ? "OPENING_STOCK" : "ADJUSTMENT_IN",
          })
        }
        productOptions={productOptions}
        summary={stockData.summary}
        totalItems={filteredItems.length}
        totalPages={totalPages}
        onClearFilters={handleClearFilters}
        onFilterChange={handleFilterChange}
        onPageChange={setCurrentPage}
        onRefresh={() => loadData(true)}
        onTogglePriority={handleTogglePriority}
        onViewHistory={setHistoryVariant}
      />

      <div className="hidden space-y-4 md:block">
        <StockPageHeader
          onAdd={() => setDrawer({ mode: "create", adjustmentType: "OPENING_STOCK" })}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
        />

        <StockSummaryCards summary={stockData.summary} />

        <StockFilterBar
          filters={filters}
          productOptions={productOptions}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {isLoading ? (
          <StockLoadingState />
        ) : (
          <StockOverviewTable
            items={paginatedItems}
            onAdjust={(variant) =>
              setDrawer({
                mode: "create",
                variant,
                adjustmentType:
                  variant.currentStock === 0 ? "OPENING_STOCK" : "ADJUSTMENT_IN",
              })
            }
            onViewHistory={setHistoryVariant}
            onTogglePriority={handleTogglePriority}
            footer={
              <StockPagination
                currentPage={safeCurrentPage}
                rowsPerPage={rowsPerPage}
                totalItems={filteredItems.length}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            }
          />
        )}
      </div>

      <StockAdjustmentDrawer
        drawer={drawer}
        variantOptions={stockData.variantOptions}
        onClose={() => setDrawer(null)}
        onSuccess={() => {
          setDrawer(null);
          loadData(true);
        }}
      />

      <StockHistoryDrawer
        variant={historyVariant}
        onClose={() => setHistoryVariant(null)}
      />
    </div>
  );
}
