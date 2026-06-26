"use client";

import { Building2, Globe, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type MobilePurchaseDraftFilters = {
  search: string;
  supplierId: string;
  country: string;
};

export function PurchasesMobileFilters({
  countries,
  filters,
  hasActiveFilters,
  suppliers,
  onApply,
  onChange,
  onClear,
}: {
  countries: string[];
  filters: MobilePurchaseDraftFilters;
  hasActiveFilters: boolean;
  suppliers: Array<{ id: number; name: string }>;
  onApply: () => void;
  onChange: (filters: MobilePurchaseDraftFilters) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        <Input
          className="h-11 rounded-2xl border-stone-200 bg-white pl-10 text-sm shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search product name..."
          value={filters.search}
        />
      </div>

      <div className="grid gap-3 min-[390px]:grid-cols-2">
        <Select
          onValueChange={(value) => onChange({ ...filters, supplierId: value })}
          value={filters.supplierId}
        >
          <SelectTrigger className="h-10 rounded-2xl border-stone-200 bg-white px-3.5 text-sm shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            <span className="mr-2 text-stone-500">
              <Building2 className="h-4 w-4" />
            </span>
            <SelectValue placeholder="Select supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Select supplier</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => onChange({ ...filters, country: value })}
          value={filters.country}
        >
          <SelectTrigger className="h-10 rounded-2xl border-stone-200 bg-white px-3.5 text-sm shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            <span className="mr-2 text-stone-500">
              <Globe className="h-4 w-4" />
            </span>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Select country</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="h-10 w-auto rounded-2xl border-emerald-200 bg-white px-4 text-emerald-800 hover:bg-emerald-50"
          onClick={onApply}
          type="button"
          variant="outline"
        >
          Apply Filter
        </Button>
        {hasActiveFilters ? (
          <Button
            className="h-10 w-auto rounded-2xl border-stone-200 bg-white px-4 text-stone-700"
            onClick={onClear}
            type="button"
            variant="outline"
          >
            <X className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
