"use client";

import type { ReactNode } from "react";
import { BellRing, Boxes, ListFilter, Search, Star, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockFilters } from "../types/stock.types";

function CompactSelect({
  value,
  onChange,
  icon,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="h-9 w-auto min-w-32 shrink-0 rounded-xl border-slate-200 bg-white px-3 text-xs shadow-sm">
        <span className="mr-2 text-slate-500">{icon}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export function StockMobileFilters({
  filters,
  productOptions,
  onFilterChange,
  onClearFilters,
}: {
  filters: StockFilters;
  productOptions: { id: number; name: string }[];
  onFilterChange: <K extends keyof StockFilters>(key: K, value: StockFilters[K]) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CompactSelect
          icon={<Boxes className="h-3.5 w-3.5" />}
          onChange={(value) => onFilterChange("productId", value)}
          value={filters.productId}
        >
          <SelectItem value="ALL">All Products</SelectItem>
          {productOptions.map((product) => (
            <SelectItem key={product.id} value={String(product.id)}>
              {product.name}
            </SelectItem>
          ))}
        </CompactSelect>

        <CompactSelect
          icon={<ListFilter className="h-3.5 w-3.5" />}
          onChange={(value) => onFilterChange("status", value as StockFilters["status"])}
          value={filters.status}
        >
          <SelectItem value="ALL">All Stock</SelectItem>
          <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
          <SelectItem value="IN_STOCK">In Stock</SelectItem>
          <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
        </CompactSelect>

        <CompactSelect
          icon={<Star className="h-3.5 w-3.5" />}
          onChange={(value) => onFilterChange("trend", value as StockFilters["trend"])}
          value={filters.trend}
        >
          <SelectItem value="ALL">All Priority</SelectItem>
          <SelectItem value="PRIORITY">Priority Only</SelectItem>
          <SelectItem value="FAST_MOVING">Fast Moving</SelectItem>
          <SelectItem value="RUNNING_OUT">Running Out</SelectItem>
          <SelectItem value="SLOW_MOVING">Slow Moving</SelectItem>
          <SelectItem value="NO_SALES">No Sales</SelectItem>
          <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
        </CompactSelect>

        <CompactSelect
          icon={<BellRing className="h-3.5 w-3.5" />}
          onChange={(value) => onFilterChange("sort", value as StockFilters["sort"])}
          value={filters.sort}
        >
          <SelectItem value="NEEDS_ATTENTION">Needs Attention</SelectItem>
          <SelectItem value="PRIORITY_FIRST">Priority First</SelectItem>
          <SelectItem value="STOCK_HIGH_TO_LOW">Stock High to Low</SelectItem>
          <SelectItem value="STOCK_LOW_TO_HIGH">Stock Low to High</SelectItem>
          <SelectItem value="NAME_A_Z">Name A-Z</SelectItem>
          <SelectItem value="RECENTLY_UPDATED">Recently Updated</SelectItem>
        </CompactSelect>
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            className="h-10 rounded-xl bg-white pl-9 text-sm shadow-sm"
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Search product, variant, SKU..."
            value={filters.search}
          />
        </div>
        <Button
          className="h-10 w-auto rounded-xl px-3 text-xs"
          onClick={onClearFilters}
          type="button"
          variant="outline"
        >
          <X className="mr-1.5 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
