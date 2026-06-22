"use client";

import { ExpenseCategory } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TableSkeleton } from "@/components/common/table-skeleton";
import { apiClient } from "@/lib/api-client";
import {
  type DrawerState,
  type ExpenseFilters,
  type ExpenseView,
} from "../types/expense.types";
import { ExpenseEmptyState } from "./expense-empty-state";
import { ExpenseFormDrawer } from "./expense-form-drawer";
import { ExpenseMobileCardList } from "./expense-mobile-card-list";
import { ExpenseSummaryCards } from "./expense-summary-cards";
import { ExpensesFilterBar } from "./expenses-filter-bar";
import { ExpensesPageHeader } from "./expenses-page-header";
import { ExpensesPagination } from "./expenses-pagination";
import { ExpensesTable } from "./expenses-table";

const MARKETING_AND_PR_CATEGORIES = new Set<ExpenseCategory>([
  ExpenseCategory.FACEBOOK_BOOST,
  ExpenseCategory.INSTAGRAM_BOOST,
  ExpenseCategory.META_ADS,
  ExpenseCategory.GIVEAWAY,
  ExpenseCategory.PR_PROMOTION,
]);

const COURIER_AND_PACKAGING_CATEGORIES = new Set<ExpenseCategory>([
  ExpenseCategory.COURIER,
  ExpenseCategory.PACKAGING,
]);

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "ALL",
  date: "ALL",
  status: "ACTIVE",
  paymentMethod: "ALL",
};

function toAmount(value: string) {
  return Number(value);
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function matchesDateFilter(dateValue: string, filter: ExpenseFilters["date"]) {
  if (filter === "ALL") {
    return true;
  }

  const expenseDate = new Date(dateValue);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (filter === "TODAY") {
    return isSameDay(expenseDate, startOfToday);
  }

  if (filter === "THIS_WEEK") {
    const day = startOfToday.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - diff);
    return expenseDate >= startOfWeek;
  }

  if (filter === "THIS_MONTH") {
    return (
      expenseDate.getFullYear() === startOfToday.getFullYear() &&
      expenseDate.getMonth() === startOfToday.getMonth()
    );
  }

  return true;
}

function buildSparklineSeries(
  expenses: ExpenseView[],
  predicate?: (expense: ExpenseView) => boolean,
) {
  const filtered = predicate ? expenses.filter(predicate) : expenses;
  const values = filtered.slice(0, 10).reverse().map((expense) => toAmount(expense.amountBdt));

  if (values.length >= 2) {
    return values;
  }

  if (values.length === 1) {
    return [values[0] * 0.7, values[0], values[0] * 1.15];
  }

  return [0, 0, 0, 0];
}

function ExpensesLoadingState() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <TableSkeleton columns={7} rows={6} />
      <div className="flex flex-col gap-3 sm:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpensesPageClient() {
  const [expenses, setExpenses] = useState<ExpenseView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await apiClient<{ expenses: ExpenseView[] }>("/api/expenses", {
        cache: "no-store",
        showErrorToast: false,
      });

      if (data?.expenses) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialExpenses() {
      try {
        const data = await apiClient<{ expenses: ExpenseView[] }>("/api/expenses", {
          cache: "no-store",
          showErrorToast: false,
        });

        if (!isCancelled && data?.expenses) {
          setExpenses(data.expenses);
        }
      } catch (error) {
        console.error("Failed to load expenses:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialExpenses();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleToggleStatus(expense: ExpenseView) {
    try {
      await apiClient<{ expense: ExpenseView }>(`/api/expenses/${expense.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !expense.isActive }),
        showSuccessToast: true,
      });
      loadData(true);
    } catch (error) {
      console.error("Failed to toggle expense status:", error);
    }
  }

  function handleFilterChange<K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K],
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

  const paymentMethods = useMemo(() => {
    return Array.from(
      new Set(
        expenses
          .map((expense) => expense.paymentMethod?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (filters.status === "ACTIVE" && !expense.isActive) {
        return false;
      }

      if (filters.status === "INACTIVE" && expense.isActive) {
        return false;
      }

      if (filters.category !== "ALL" && expense.category !== filters.category) {
        return false;
      }

      if (filters.paymentMethod !== "ALL" && expense.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      if (!matchesDateFilter(expense.date, filters.date)) {
        return false;
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const haystack = `${expense.title} ${expense.notes ?? ""}`.toLowerCase();

        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, filters]);

  const activeExpenses = useMemo(
    () => expenses.filter((expense) => expense.isActive),
    [expenses],
  );

  const totals = useMemo(() => {
    const totalExpenses = activeExpenses.reduce(
      (sum, expense) => sum + toAmount(expense.amountBdt),
      0,
    );

    const productPurchases = activeExpenses
      .filter((expense) => expense.category === ExpenseCategory.PRODUCT_PURCHASE)
      .reduce((sum, expense) => sum + toAmount(expense.amountBdt), 0);

    const marketingAndPr = activeExpenses
      .filter((expense) => MARKETING_AND_PR_CATEGORIES.has(expense.category))
      .reduce((sum, expense) => sum + toAmount(expense.amountBdt), 0);

    const courierAndPackaging = activeExpenses
      .filter((expense) => COURIER_AND_PACKAGING_CATEGORIES.has(expense.category))
      .reduce((sum, expense) => sum + toAmount(expense.amountBdt), 0);

    const otherCosts = activeExpenses
      .filter(
        (expense) =>
          expense.category !== ExpenseCategory.PRODUCT_PURCHASE &&
          !MARKETING_AND_PR_CATEGORIES.has(expense.category) &&
          !COURIER_AND_PACKAGING_CATEGORIES.has(expense.category),
      )
      .reduce((sum, expense) => sum + toAmount(expense.amountBdt), 0);

    return {
      totalExpenses,
      productPurchases,
      marketingAndPr,
      courierAndPackaging,
      otherCosts,
    };
  }, [activeExpenses]);

  const sparklineSeries = useMemo(() => {
    return {
      totalExpenses: buildSparklineSeries(activeExpenses),
      productPurchases: buildSparklineSeries(
        activeExpenses,
        (expense) => expense.category === ExpenseCategory.PRODUCT_PURCHASE,
      ),
      marketingAndPr: buildSparklineSeries(
        activeExpenses,
        (expense) => MARKETING_AND_PR_CATEGORIES.has(expense.category),
      ),
      courierAndPackaging: buildSparklineSeries(
        activeExpenses,
        (expense) => COURIER_AND_PACKAGING_CATEGORIES.has(expense.category),
      ),
      otherCosts: buildSparklineSeries(
        activeExpenses,
        (expense) =>
          expense.category !== ExpenseCategory.PRODUCT_PURCHASE &&
          !MARKETING_AND_PR_CATEGORIES.has(expense.category) &&
          !COURIER_AND_PACKAGING_CATEGORIES.has(expense.category),
      ),
    };
  }, [activeExpenses]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedExpenses = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return filteredExpenses.slice(start, start + rowsPerPage);
  }, [filteredExpenses, rowsPerPage, safeCurrentPage]);

  const hasFilters = useMemo(() => {
    return (
      filters.search !== DEFAULT_FILTERS.search ||
      filters.category !== DEFAULT_FILTERS.category ||
      filters.date !== DEFAULT_FILTERS.date ||
      filters.status !== DEFAULT_FILTERS.status ||
      filters.paymentMethod !== DEFAULT_FILTERS.paymentMethod
    );
  }, [filters]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <ExpensesPageHeader
        onAdd={() => setDrawer({ mode: "create" })}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <ExpenseSummaryCards totals={totals} sparklineSeries={sparklineSeries} />

      <ExpensesFilterBar
        filters={filters}
        paymentMethods={paymentMethods}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {isLoading ? (
        <ExpensesLoadingState />
      ) : filteredExpenses.length === 0 ? (
        <ExpenseEmptyState
          onAdd={() => setDrawer({ mode: "create" })}
          hasFilters={hasFilters}
        />
      ) : (
        <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
          <div className="hidden sm:block">
            <ExpensesTable
              expenses={paginatedExpenses}
              onEdit={(expense) => setDrawer({ mode: "edit", expense })}
              onToggleStatus={handleToggleStatus}
            />
          </div>
          <div className="block p-4 sm:hidden">
            <ExpenseMobileCardList
              expenses={paginatedExpenses}
              onEdit={(expense) => setDrawer({ mode: "edit", expense })}
              onToggleStatus={handleToggleStatus}
            />
          </div>
          <ExpensesPagination
            currentPage={safeCurrentPage}
            rowsPerPage={rowsPerPage}
            totalItems={filteredExpenses.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>
      )}

      <ExpenseFormDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        onSuccess={() => {
          setDrawer(null);
          loadData(true);
        }}
      />
    </div>
  );
}
