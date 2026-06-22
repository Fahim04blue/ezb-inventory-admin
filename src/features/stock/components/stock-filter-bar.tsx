import { Boxes, Search, SlidersHorizontal, Star, X } from "lucide-react";

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

interface StockFilterBarProps {
  filters: StockFilters;
  productOptions: {
    id: number;
    name: string;
  }[];
  onFilterChange: <K extends keyof StockFilters>(
    key: K,
    value: StockFilters[K],
  ) => void;
  onClearFilters: () => void;
}

export function StockFilterBar({
  filters,
  productOptions,
  onFilterChange,
  onClearFilters,
}: StockFilterBarProps) {
  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="flex max-w-full flex-wrap items-center gap-2 lg:flex-nowrap">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Search product, variant, SKU..."
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm"
          />
        </div>

        <div className="relative min-w-[190px] flex-1 lg:flex-none">
          <Boxes className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Select
            value={filters.productId}
            onValueChange={(value) => onFilterChange("productId", value)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-8 text-left text-sm shadow-sm lg:w-[220px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              {productOptions.map((product) => (
                <SelectItem key={product.id} value={String(product.id)}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative min-w-[180px] flex-1 lg:flex-none">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFilterChange("status", value as StockFilters["status"])
            }
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-8 text-left text-sm shadow-sm lg:w-[190px]">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stock</SelectItem>
              <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
              <SelectItem value="IN_STOCK">In Stock</SelectItem>
              <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative min-w-[180px] flex-1 lg:flex-none">
          <Star className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Select
            value={filters.trend}
            onValueChange={(value) =>
              onFilterChange("trend", value as StockFilters["trend"])
            }
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-8 text-left text-sm shadow-sm lg:w-[190px]">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priority</SelectItem>
              <SelectItem value="PRIORITY">Priority Only</SelectItem>
              <SelectItem value="FAST_MOVING">Fast Moving</SelectItem>
              <SelectItem value="RUNNING_OUT">Running Out</SelectItem>
              <SelectItem value="SLOW_MOVING">Slow Moving</SelectItem>
              <SelectItem value="NO_SALES">No Sales</SelectItem>
              <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative min-w-[180px] flex-1 lg:flex-none">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              onFilterChange("sort", value as StockFilters["sort"])
            }
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-8 text-left text-sm shadow-sm lg:w-[200px]">
              <SelectValue placeholder="Needs Attention" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEEDS_ATTENTION">Needs Attention</SelectItem>
              <SelectItem value="PRIORITY_FIRST">Priority First</SelectItem>
              <SelectItem value="STOCK_HIGH_TO_LOW">Stock High to Low</SelectItem>
              <SelectItem value="STOCK_LOW_TO_HIGH">Stock Low to High</SelectItem>
              <SelectItem value="NAME_A_Z">Name A-Z</SelectItem>
              <SelectItem value="RECENTLY_UPDATED">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={onClearFilters}
          className="h-10 w-auto shrink-0 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm"
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
