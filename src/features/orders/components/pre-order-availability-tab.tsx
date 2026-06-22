"use client";

import {
  Globe2,
  ListFilter,
  PackageCheck,
  Search,
  Store,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { PurchaseStatus } from "@/lib/domain-enums";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatEnum, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { PreOrderPurchaseItemOption } from "../types/order.types";

type AvailabilityFilter = "ALL" | "AVAILABLE" | "FULLY_RESERVED";

type PreOrderAvailabilityTabProps = {
  batches: PreOrderPurchaseItemOption[];
  onCreatePreOrder: (batch: PreOrderPurchaseItemOption) => void;
};

function toAmount(value: string | null) {
  return Number(value || 0);
}

function isPresent(value: string | null): value is string {
  return Boolean(value);
}

function batchValue(batch: PreOrderPurchaseItemOption) {
  return batch.quantity * toAmount(batch.finalUnitLandedCostBdt);
}

function potentialRevenue(batch: PreOrderPurchaseItemOption) {
  if (!batch.suggestedSellingPrice) {
    return null;
  }

  return batch.availableIncomingQuantity * toAmount(batch.suggestedSellingPrice);
}

function expectedProfit(batch: PreOrderPurchaseItemOption) {
  const revenue = potentialRevenue(batch);

  if (revenue == null) {
    return null;
  }

  return revenue - batch.availableIncomingQuantity * toAmount(batch.finalUnitLandedCostBdt);
}

function statusClass(status: PurchaseStatus) {
  if (status === PurchaseStatus.IN_CARGO) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === PurchaseStatus.PARTIALLY_RECEIVED) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

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

export function PreOrderAvailabilityTab({
  batches,
  onCreatePreOrder,
}: PreOrderAvailabilityTabProps) {
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("ALL");
  const [country, setCountry] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | PurchaseStatus>("ALL");
  const [availability, setAvailability] = useState<AvailabilityFilter>("ALL");

  const suppliers = useMemo(
    () =>
      Array.from(new Set(batches.map((batch) => batch.supplierName).filter(isPresent))).sort(),
    [batches],
  );
  const countries = useMemo(
    () => Array.from(new Set(batches.map((batch) => batch.country).filter(isPresent))).sort(),
    [batches],
  );

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return batches.filter((batch) => {
      const matchesSearch =
        !query ||
        [
          batch.productName,
          batch.variantName,
          batch.sku,
          batch.brandName,
          batch.categoryName,
          batch.purchaseRef,
          batch.supplierName,
          batch.country,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      const matchesSupplier = supplier === "ALL" || batch.supplierName === supplier;
      const matchesCountry = country === "ALL" || batch.country === country;
      const matchesStatus = status === "ALL" || batch.purchaseStatus === status;
      const matchesAvailability =
        availability === "ALL" ||
        (availability === "AVAILABLE" && batch.availableIncomingQuantity > 0) ||
        (availability === "FULLY_RESERVED" && batch.availableIncomingQuantity === 0);

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesCountry &&
        matchesStatus &&
        matchesAvailability
      );
    });
  }, [availability, batches, country, search, status, supplier]);

  const totals = useMemo(
    () => ({
      incomingQty: filteredBatches.reduce((sum, batch) => sum + batch.quantity, 0),
      preOrderedQty: filteredBatches.reduce(
        (sum, batch) => sum + batch.reservedPreOrderQuantity,
        0,
      ),
      availableQty: filteredBatches.reduce(
        (sum, batch) => sum + batch.availableIncomingQuantity,
        0,
      ),
      fullyReservedItems: filteredBatches.filter(
        (batch) => batch.availableIncomingQuantity === 0,
      ).length,
      incomingValue: filteredBatches.reduce((sum, batch) => sum + batchValue(batch), 0),
    }),
    [filteredBatches],
  );

  const cards = [
    {
      label: "Total Incoming Qty",
      value: formatNumber(totals.incomingQty),
      icon: PackageCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Pre-ordered Qty",
      value: formatNumber(totals.preOrderedQty),
      icon: PackageCheck,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Available to Pre-order",
      value: formatNumber(totals.availableQty),
      icon: TrendingUp,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Fully Reserved Items",
      value: formatNumber(totals.fullyReservedItems),
      icon: PackageCheck,
      tone: "bg-rose-50 text-rose-700",
    },
    {
      label: "Incoming Purchase Value",
      value: formatCurrency(totals.incomingValue),
      icon: WalletCards,
      tone: "bg-slate-100 text-slate-700",
    },
  ];

  function clearFilters() {
    setSearch("");
    setSupplier("ALL");
    setCountry("ALL");
    setStatus("ALL");
    setAvailability("ALL");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 truncate text-lg font-semibold text-slate-950">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-full p-2 ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
        <div className="flex max-w-full flex-wrap items-center gap-2 2xl:flex-nowrap">
          <div className="relative min-w-[220px] flex-1 2xl:min-w-[300px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, variant, SKU, purchase..."
              value={search}
            />
          </div>

          <FilterSelect
            className="2xl:basis-[180px] 2xl:flex-none"
            icon={<Store className="h-4 w-4" />}
            onValueChange={setSupplier}
            placeholder="Supplier"
            value={supplier}
          >
            <SelectItem value="ALL">All Suppliers</SelectItem>
            {suppliers.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            className="2xl:basis-[170px] 2xl:flex-none"
            icon={<Globe2 className="h-4 w-4" />}
            onValueChange={setCountry}
            placeholder="Country"
            value={country}
          >
            <SelectItem value="ALL">All Countries</SelectItem>
            {countries.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            className="2xl:basis-[180px] 2xl:flex-none"
            icon={<ListFilter className="h-4 w-4" />}
            onValueChange={(value) => setStatus(value as "ALL" | PurchaseStatus)}
            placeholder="Purchase Status"
            value={status}
          >
            <SelectItem value="ALL">All Statuses</SelectItem>
            {[
              PurchaseStatus.ORDERED,
              PurchaseStatus.IN_CARGO,
              PurchaseStatus.PARTIALLY_RECEIVED,
            ].map((item) => (
              <SelectItem key={item} value={item}>
                {formatEnum(item)}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            className="2xl:basis-[190px] 2xl:flex-none"
            icon={<PackageCheck className="h-4 w-4" />}
            onValueChange={(value) => setAvailability(value as AvailabilityFilter)}
            placeholder="Availability"
            value={availability}
          >
            <SelectItem value="ALL">All Availability</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="FULLY_RESERVED">Fully Reserved</SelectItem>
          </FilterSelect>

          <Button
            className="h-10 w-auto shrink-0 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm 2xl:min-w-[96px]"
            onClick={clearFilters}
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-slate-50/80">
                <TableHead className="min-w-[240px] px-3 text-xs font-semibold text-slate-700">
                  Product / Variant
                </TableHead>
                <TableHead className="min-w-[120px] text-xs font-semibold text-slate-700">
                  Purchase Ref
                </TableHead>
                <TableHead className="min-w-[170px] text-xs font-semibold text-slate-700">
                  Supplier / Country
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">
                  Purchased
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">
                  Received
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">
                  Pre-ordered
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">
                  Available
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">
                  Unit Cost
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">
                  Potential Revenue
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700">
                  Expected Profit
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="pr-3 text-right text-xs font-semibold text-slate-700">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => {
                const revenue = potentialRevenue(batch);
                const profit = expectedProfit(batch);

                return (
                  <TableRow key={batch.id} className="h-11 hover:bg-slate-50/70">
                    <TableCell className="px-3 py-1.5">
                      <div className="max-w-[260px]">
                        <p className="truncate text-sm font-medium text-slate-950">
                          {batch.productName} - {batch.variantName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {[batch.brandName, batch.categoryName, batch.sku ? `SKU ${batch.sku}` : null]
                            .filter(Boolean)
                            .join(" / ") || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 text-sm font-medium text-slate-800">
                      {batch.purchaseRef}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <p className="truncate text-sm text-slate-900">
                        {batch.supplierName || "-"}
                      </p>
                      <p className="text-xs text-slate-500">{batch.country || "-"}</p>
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-sm">
                      {formatNumber(batch.quantity)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-sm">
                      {formatNumber(batch.receivedQuantity)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-sm">
                      {formatNumber(batch.reservedPreOrderQuantity)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-sm font-semibold text-emerald-700">
                      {formatNumber(batch.availableIncomingQuantity)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(batch.finalUnitLandedCostBdt)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-sm font-medium text-slate-900">
                      {revenue == null ? "-" : formatCurrency(revenue)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-sm font-semibold">
                      {profit == null ? (
                        "-"
                      ) : (
                        <span className={profit < 0 ? "text-rose-600" : "text-emerald-700"}>
                          {formatCurrency(profit)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge className={`border px-2 py-0 text-[11px] ${statusClass(batch.purchaseStatus)}`}>
                        {formatEnum(batch.purchaseStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 pr-3 text-right">
                      <Button
                        className="h-8 w-auto rounded-xl bg-emerald-800 px-3 text-xs text-white hover:bg-emerald-900"
                        disabled={batch.availableIncomingQuantity <= 0}
                        onClick={() => onCreatePreOrder(batch)}
                      >
                        Create Pre-order
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filteredBatches.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <h2 className="text-base font-semibold text-slate-950">
              No incoming pre-order batches found
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Clear filters or add incoming purchases to see availability.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
