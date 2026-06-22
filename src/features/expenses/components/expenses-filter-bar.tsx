import { ExpenseCategory } from "@prisma/client";
import { CalendarDays, ListFilter, Search, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  ExpenseDateFilter,
  ExpenseFilters,
  ExpenseStatusFilter,
} from "../types/expense.types";

interface ExpensesFilterBarProps {
  filters: ExpenseFilters;
  paymentMethods: string[];
  onFilterChange: <K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K],
  ) => void;
  onClearFilters: () => void;
}

const DATE_OPTIONS: { value: ExpenseDateFilter; label: string }[] = [
  { value: "ALL", label: "All Time" },
  { value: "TODAY", label: "Today" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "THIS_MONTH", label: "This Month" },
];

const STATUS_OPTIONS: { value: ExpenseStatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Active Only" },
  { value: "INACTIVE", label: "Inactive Only" },
  { value: "ALL", label: "All" },
];

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  icon,
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative min-w-[150px] flex-1", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-500">
        {icon}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-8 text-left text-sm shadow-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

export function ExpensesFilterBar({
  filters,
  paymentMethods,
  onFilterChange,
  onClearFilters,
}: ExpensesFilterBarProps) {
  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="flex max-w-full flex-wrap items-center gap-2 xl:flex-nowrap">
        <FilterSelect
          className="xl:basis-[210px] xl:flex-none"
          value={filters.category}
          onValueChange={(value) =>
            onFilterChange("category", value as ExpenseFilters["category"])
          }
          placeholder="All Categories"
          icon={<ListFilter className="h-4 w-4" />}
        >
          <SelectItem value="ALL">All Categories</SelectItem>
          {Object.values(ExpenseCategory).map((category) => (
            <SelectItem key={category} value={category}>
              {formatEnum(category)}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          className="xl:basis-[170px] xl:flex-none"
          value={filters.date}
          onValueChange={(value) =>
            onFilterChange("date", value as ExpenseDateFilter)
          }
          placeholder="All Time"
          icon={<CalendarDays className="h-4 w-4" />}
        >
          {DATE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          className="xl:basis-[190px] xl:flex-none"
          value={filters.status}
          onValueChange={(value) =>
            onFilterChange("status", value as ExpenseStatusFilter)
          }
          placeholder="Active Only"
          icon={<ListFilter className="h-4 w-4" />}
        >
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          className="xl:basis-[230px] xl:flex-none"
          value={filters.paymentMethod}
          onValueChange={(value) => onFilterChange("paymentMethod", value)}
          placeholder="All Payment Methods"
          icon={<Wallet className="h-4 w-4" />}
        >
          <SelectItem value="ALL">All Payment Methods</SelectItem>
          {paymentMethods.map((method) => (
            <SelectItem key={method} value={method}>
              {method}
            </SelectItem>
          ))}
        </FilterSelect>

        <div className="relative min-w-[220px] flex-1 xl:min-w-[250px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Search title or notes..."
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm"
          />
        </div>

        <Button
          variant="outline"
          onClick={onClearFilters}
          className="h-10 w-auto shrink-0 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm xl:min-w-[124px]"
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
