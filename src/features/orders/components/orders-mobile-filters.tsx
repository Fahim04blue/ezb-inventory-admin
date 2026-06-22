"use client";

import { CalendarDays, CreditCard, ListFilter, Search, Store, X } from "lucide-react";
import { OrderSource, OrderStatus, PaymentStatus } from "@/lib/domain-enums";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEnum } from "@/lib/formatters";
import type { OrderFilters } from "../types/order.types";

type Props = {
  filters: OrderFilters;
  onFilterChange: <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => void;
  onClearFilters: () => void;
};

function CompactSelect({ value, onChange, icon, children }: { value: string; onChange: (value: string) => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="h-9 w-auto min-w-32 shrink-0 rounded-xl border-slate-200 bg-white px-3 text-xs shadow-sm">
        <span className="mr-2 text-slate-500">{icon}</span><SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export function OrdersMobileFilters({ filters, onFilterChange, onClearFilters }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CompactSelect icon={<ListFilter className="h-3.5 w-3.5" />} onChange={(value) => onFilterChange("status", value as OrderFilters["status"])} value={filters.status}>
          <SelectItem value="ALL">All Statuses</SelectItem>{Object.values(OrderStatus).map((value) => <SelectItem key={value} value={value}>{formatEnum(value)}</SelectItem>)}
        </CompactSelect>
        <CompactSelect icon={<CreditCard className="h-3.5 w-3.5" />} onChange={(value) => onFilterChange("paymentStatus", value as OrderFilters["paymentStatus"])} value={filters.paymentStatus}>
          <SelectItem value="ALL">All Payments</SelectItem>{Object.values(PaymentStatus).map((value) => <SelectItem key={value} value={value}>{formatEnum(value)}</SelectItem>)}
        </CompactSelect>
        <CompactSelect icon={<Store className="h-3.5 w-3.5" />} onChange={(value) => onFilterChange("source", value as OrderFilters["source"])} value={filters.source}>
          <SelectItem value="ALL">All Sources</SelectItem>{Object.values(OrderSource).map((value) => <SelectItem key={value} value={value}>{formatEnum(value)}</SelectItem>)}
        </CompactSelect>
        <CompactSelect icon={<CalendarDays className="h-3.5 w-3.5" />} onChange={(value) => onFilterChange("date", value as OrderFilters["date"])} value={filters.date}>
          <SelectItem value="ALL">All Time</SelectItem><SelectItem value="TODAY">Today</SelectItem><SelectItem value="THIS_WEEK">This Week</SelectItem><SelectItem value="THIS_MONTH">This Month</SelectItem>
        </CompactSelect>
      </div>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input className="h-10 rounded-xl bg-white pl-9 text-sm shadow-sm" onChange={(event) => onFilterChange("search", event.target.value)} placeholder="Search order or customer..." value={filters.search} /></div>
        <Button className="h-10 w-auto rounded-xl px-3 text-xs" onClick={onClearFilters} variant="outline"><X className="mr-1.5 h-4 w-4" />Clear</Button>
      </div>
    </div>
  );
}
