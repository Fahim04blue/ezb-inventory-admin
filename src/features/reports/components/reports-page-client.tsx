"use client";

import { Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/formatters";
import type { ReportFilters, ReportsOverview } from "../types/report.types";
import { ReportsChartCard } from "./reports-chart-card";
import { ReportsExpenseBreakdown } from "./reports-expense-breakdown";
import { ReportsFilterBar } from "./reports-filter-bar";
import { ReportsFinanceOverview } from "./reports-finance-overview";
import { ReportsInventoryOverview } from "./reports-inventory-overview";
import { ReportsPageHeader } from "./reports-page-header";
import { ReportsPreorderOverview } from "./reports-preorder-overview";
import { ReportsSalesBreakdown } from "./reports-sales-breakdown";
import { ReportsSummaryCards } from "./reports-summary-cards";

const DEFAULT_FILTERS: ReportFilters = { dateRange: "all", from: "", to: "" };

function ReportsLoadingState() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
            <div className="h-3 w-2/5 rounded bg-slate-200" />
            <div className="mt-4 h-6 w-3/5 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="mt-6 h-48 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsTrend({ data }: { data: ReportsOverview["trends"] }) {
  if (!data.length) {
    return <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">No report trend data yet.</div>;
  }
  const max = Math.max(...data.flatMap((item) => [Number(item.sales), Number(item.expenses)]), 1);
  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Sales</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />Expenses</span>
      </div>
      {data.map((item) => (
        <div key={item.key} className="grid grid-cols-[58px_1fr_auto] items-center gap-2">
          <span className="text-xs font-medium text-slate-600">{item.label}</span>
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Number(item.sales) / max * 100}%` }} /></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Number(item.expenses) / max * 100}%` }} /></div>
          </div>
          <span className={`min-w-[92px] text-right text-xs font-semibold ${Number(item.profit) < 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {formatCurrency(item.profit)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ReportsPageClient() {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [report, setReport] = useState<ReportsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReport = useCallback(async () => {
    if (filters.dateRange === "custom" && (!filters.from || !filters.to)) {
      return null;
    }
    const params = new URLSearchParams({ dateRange: filters.dateRange });
    if (filters.dateRange === "custom") {
      params.set("from", filters.from);
      params.set("to", filters.to);
    }
    return apiClient<ReportsOverview>(`/api/reports/overview?${params}`, { cache: "no-store" });
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchReport();
        if (!cancelled && data) setReport(data);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [fetchReport]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const data = await fetchReport();
      if (data) setReport(data);
    } catch (error) {
      console.error("Failed to refresh reports:", error);
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleChange<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "dateRange" && value !== "custom" ? { from: "", to: "" } : {}),
    }));
  }

  return (
    <div className="space-y-5">
      <ReportsPageHeader onRefresh={() => void handleRefresh()} isRefreshing={isRefreshing} />
      <ReportsFilterBar filters={filters} onChange={handleChange} onClear={() => setFilters(DEFAULT_FILTERS)} />
      {isLoading && !report ? <ReportsLoadingState /> : report ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-800">{report.period.label} Overview</h2>
            <span className="text-xs text-slate-500">Inventory value is current</span>
          </div>
          <ReportsSummaryCards summary={report.summary} />
          <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
            <ReportsChartCard title="Sales vs Expenses Trend" description="Monthly operating performance; right value is profit after operating expenses.">
              <ReportsTrend data={report.trends} />
            </ReportsChartCard>
            <ReportsFinanceOverview finance={report.finance} />
          </div>
          <ReportsSalesBreakdown sales={report.sales} topProducts={report.topProducts} />
          <ReportsExpenseBreakdown expenses={report.expenses} />
          <div className="grid gap-3 lg:grid-cols-2">
            <ReportsInventoryOverview inventory={report.inventory} />
            <ReportsPreorderOverview preOrders={report.preOrders} />
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3">
            {report.notes.map((note) => (
              <p key={note} className="flex gap-2 text-xs leading-5 text-blue-900"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{note}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Reports could not be loaded.</div>
      )}
    </div>
  );
}
