import { CalendarDays, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportDateRange, ReportFilters } from "../types/report.types";

const OPTIONS: Array<{ value: ReportDateRange; label: string }> = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

export function ReportsFilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: ReportFilters;
  onChange: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void;
  onClear: () => void;
}) {
  const custom = filters.dateRange === "custom";
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[190px] flex-1 sm:flex-none">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Date range</span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Select
              value={filters.dateRange}
              onValueChange={(value) => onChange("dateRange", value as ReportDateRange)}
            >
              <SelectTrigger className="h-10 rounded-xl border-slate-200 pl-9 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </label>
        <label className="min-w-[165px] flex-1 sm:flex-none">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">From date</span>
          <Input
            type="date"
            value={filters.from}
            disabled={!custom}
            max={filters.to || undefined}
            onChange={(event) => onChange("from", event.target.value)}
            className="rounded-xl border-slate-200"
          />
        </label>
        <label className="min-w-[165px] flex-1 sm:flex-none">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">To date</span>
          <Input
            type="date"
            value={filters.to}
            disabled={!custom}
            min={filters.from || undefined}
            onChange={(event) => onChange("to", event.target.value)}
            className="rounded-xl border-slate-200"
          />
        </label>
        <Button
          variant="outline"
          onClick={onClear}
          className="h-10 w-auto rounded-xl border-slate-200 bg-white px-3 shadow-sm"
        >
          <X className="mr-2 h-4 w-4" /> Clear Filters
        </Button>
      </div>
    </div>
  );
}
