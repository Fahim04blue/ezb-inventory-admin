"use client";

import {
  CalendarDays,
  CreditCard,
  ListFilter,
  Search,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { OrderSource, OrderStatus, OrderType, PaymentStatus } from "@prisma/client";

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
import type { OrderFilters } from "../types/order.types";

type OrdersFilterBarProps = {
  filters: OrderFilters;
  onFilterChange: <K extends keyof OrderFilters>(
    key: K,
    value: OrderFilters[K],
  ) => void;
  onClearFilters: () => void;
};

const DATE_OPTIONS = [
  { value: "ALL", label: "All Time" },
  { value: "TODAY", label: "Today" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "THIS_MONTH", label: "This Month" },
] as const;

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
    <div className={cn("relative min-w-[145px] flex-1", className)}>
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

export function OrdersFilterBar({
  filters,
  onFilterChange,
  onClearFilters,
}: OrdersFilterBarProps) {
  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="flex max-w-full flex-wrap items-center gap-2 2xl:flex-nowrap">
        <FilterSelect
          className="2xl:basis-[170px] 2xl:flex-none"
          icon={<ShoppingBag className="h-4 w-4" />}
          onValueChange={(value) =>
            onFilterChange("orderType", value as OrderFilters["orderType"])
          }
          placeholder="All Orders"
          value={filters.orderType}
        >
          <SelectItem value="ALL">All Orders</SelectItem>
          {Object.values(OrderType).map((type) => (
            <SelectItem key={type} value={type}>
              {formatEnum(type)}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          className="2xl:basis-[180px] 2xl:flex-none"
          icon={<ListFilter className="h-4 w-4" />}
          onValueChange={(value) =>
            onFilterChange("status", value as OrderFilters["status"])
          }
          placeholder="All Statuses"
          value={filters.status}
        >
          <SelectItem value="ALL">All Statuses</SelectItem>
          {Object.values(OrderStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {formatEnum(status)}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          className="2xl:basis-[180px] 2xl:flex-none"
          icon={<CreditCard className="h-4 w-4" />}
          onValueChange={(value) =>
            onFilterChange("paymentStatus", value as OrderFilters["paymentStatus"])
          }
          placeholder="Payment"
          value={filters.paymentStatus}
        >
          <SelectItem value="ALL">All Payments</SelectItem>
          {Object.values(PaymentStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {formatEnum(status)}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          className="2xl:basis-[160px] 2xl:flex-none"
          icon={<Store className="h-4 w-4" />}
          onValueChange={(value) =>
            onFilterChange("source", value as OrderFilters["source"])
          }
          placeholder="Source"
          value={filters.source}
        >
          <SelectItem value="ALL">All Sources</SelectItem>
          {Object.values(OrderSource).map((source) => (
            <SelectItem key={source} value={source}>
              {formatEnum(source)}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          className="2xl:basis-[160px] 2xl:flex-none"
          icon={<CalendarDays className="h-4 w-4" />}
          onValueChange={(value) =>
            onFilterChange("date", value as OrderFilters["date"])
          }
          placeholder="All Time"
          value={filters.date}
        >
          {DATE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <div className="relative min-w-[220px] flex-1 2xl:min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm"
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Search order or customer..."
            value={filters.search}
          />
        </div>

        <Button
          className="h-10 w-auto shrink-0 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm 2xl:min-w-[114px]"
          onClick={onClearFilters}
          variant="outline"
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
