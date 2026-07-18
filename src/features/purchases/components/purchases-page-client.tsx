"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { PaymentStatus } from "@/lib/domain-enums";
import { apiClient } from "@/lib/api-client";
import { CrudPageHeader } from "@/components/common/crud-page-header";
import { PurchasesList } from "./purchases-list";
import { PurchaseFormDrawer } from "./purchase-form-drawer";
import { PurchasePaymentDrawer } from "./purchase-payment-drawer";
import { PurchaseReceiveStockDrawer } from "./purchase-receive-stock-drawer";
import { type PurchaseView, type PurchaseDrawerState } from "../types/purchase.types";
import { PurchasesMobileView, type MobilePurchaseSort } from "./purchases-mobile-view";
import { type MobilePurchaseDraftFilters } from "./purchases-mobile-filters";
import { Loader2 } from "lucide-react";

const MOBILE_PAGE_SIZE = 5;

const DEFAULT_MOBILE_FILTERS: MobilePurchaseDraftFilters = {
  search: "",
  supplierId: "ALL",
  country: "ALL",
};

export function PurchasesPageClient() {
  const [purchases, setPurchases] = useState<PurchaseView[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [currencyRates, setCurrencyRates] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionLabel, setActionLabel] = useState("Updating purchase…");
  const [drawer, setDrawer] = useState<PurchaseDrawerState>(null);
  const [paymentPurchase, setPaymentPurchase] = useState<PurchaseView | null>(null);
  const [receivePurchase, setReceivePurchase] = useState<PurchaseView | null>(null);
  const [selectedMobilePurchase, setSelectedMobilePurchase] = useState<PurchaseView | null>(null);
  const [mobileDraftFilters, setMobileDraftFilters] = useState<MobilePurchaseDraftFilters>(DEFAULT_MOBILE_FILTERS);
  const [mobileAppliedFilters, setMobileAppliedFilters] = useState<MobilePurchaseDraftFilters>(DEFAULT_MOBILE_FILTERS);
  const [mobileSort, setMobileSort] = useState<MobilePurchaseSort>("NEWEST");
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_PAGE_SIZE);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [purchasesRes, suppliersRes, ratesRes, variantsRes] = await Promise.all([
        apiClient<any>("/api/purchases", { cache: "no-store", showErrorToast: false }),
        apiClient<any>("/api/suppliers", { cache: "no-store", showErrorToast: false }),
        apiClient<any>("/api/currency-rates", { cache: "no-store", showErrorToast: false }),
        apiClient<any>("/api/products?includeVariants=true", { cache: "no-store", showErrorToast: false }),
      ]);

      if (purchasesRes?.purchases) {
        setPurchases(purchasesRes.purchases);
      }
      
      if (suppliersRes?.suppliers) {
        setSuppliers(suppliersRes.suppliers);
      }
      
      if (ratesRes?.currencyRates) {
        setCurrencyRates(ratesRes.currencyRates.filter((r: any) => r.isActive));
      }
      
      if (variantsRes?.products) {
        const allVariants = variantsRes.products.flatMap((p: any) => 
          p.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            productId: p.id,
            productName: p.name,
            brandName: p.brand?.name || null,
            categoryName: p.category?.name || null,
            suggestedSellingPrice: v.suggestedSellingPrice || null,
            sizeValue: v.productSizeValue || null,
            sizeUnit: v.productSizeUnit || null,
            shippingWeightKg: v.shippingWeightKg || null,
            imageUrl: v.imageUrl || null,
          }))
        );
        setVariants(allVariants);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSuccess = (_message: string) => {
    setDrawer(null);
    setSelectedMobilePurchase(null);
    loadData(true);
  };

  const mobileCountries = useMemo(() => {
    return [...new Set(purchases.map((purchase) => purchase.country?.trim()).filter(Boolean) as string[])].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [purchases]);

  const hasActiveMobileFilters = useMemo(() => {
    return (
      mobileAppliedFilters.search.trim().length > 0 ||
      mobileAppliedFilters.supplierId !== "ALL" ||
      mobileAppliedFilters.country !== "ALL"
    );
  }, [mobileAppliedFilters]);

  const filteredMobilePurchases = useMemo(() => {
    const search = mobileAppliedFilters.search.trim().toLowerCase();

    const filtered = purchases.filter((purchase) => {
      const matchesSupplier =
        mobileAppliedFilters.supplierId === "ALL" ||
        purchase.supplier?.id.toString() === mobileAppliedFilters.supplierId;
      const matchesCountry =
        mobileAppliedFilters.country === "ALL" ||
        (purchase.country || "").toLowerCase() === mobileAppliedFilters.country.toLowerCase();
      const matchesSearch =
        !search ||
        purchase.items.some((item) =>
          `${item.productVariant.product.name} ${item.productVariant.name}`
            .toLowerCase()
            .includes(search),
        );

      return matchesSupplier && matchesCountry && matchesSearch;
    });

    return [...filtered].sort((first, second) => {
      if (mobileSort === "OLDEST") {
        return new Date(first.purchaseDate).getTime() - new Date(second.purchaseDate).getTime();
      }
      if (mobileSort === "HIGHEST_LANDED") {
        return Number(second.totalLandedCostBdt) - Number(first.totalLandedCostBdt);
      }
      if (mobileSort === "LOWEST_LANDED") {
        return Number(first.totalLandedCostBdt) - Number(second.totalLandedCostBdt);
      }
      return new Date(second.purchaseDate).getTime() - new Date(first.purchaseDate).getTime();
    });
  }, [mobileAppliedFilters, mobileSort, purchases]);

  const visibleMobilePurchases = useMemo(() => {
    return filteredMobilePurchases.slice(0, mobileVisibleCount);
  }, [filteredMobilePurchases, mobileVisibleCount]);

  function applyMobileFilters() {
    setMobileAppliedFilters(mobileDraftFilters);
    setMobileVisibleCount(MOBILE_PAGE_SIZE);
  }

  function clearMobileFilters() {
    setMobileDraftFilters(DEFAULT_MOBILE_FILTERS);
    setMobileAppliedFilters(DEFAULT_MOBILE_FILTERS);
    setMobileVisibleCount(MOBILE_PAGE_SIZE);
  }

  function handleOpenEditPurchase(purchase: PurchaseView) {
    setSelectedMobilePurchase(null);
    setDrawer({ mode: "edit", purchase });
  }

  async function handleUpdatePayment(purchase: PurchaseView, paymentStatus: PaymentStatus) {
    setActionLabel("Updating supplier payment…");
    setIsActionSubmitting(true);

    try {
      await apiClient<{ purchase: PurchaseView }>(`/api/purchases/${purchase.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
        showSuccessToast: true,
      });
      setPaymentPurchase(null);
      setSelectedMobilePurchase(null);
      await loadData(true);
    } catch (error) {
      console.error("Failed to update purchase payment:", error);
    } finally {
      setIsActionSubmitting(false);
    }
  }

  async function handleReceiveStock(
    purchase: PurchaseView,
    items: Array<{ purchaseItemId: number; receiveQuantity: number }>,
  ) {
    setActionLabel("Receiving stock…");
    setIsActionSubmitting(true);

    try {
      await apiClient<{ purchase: PurchaseView }>(
        `/api/purchases/${purchase.id}/receive-stock`,
        {
          method: "PATCH",
          body: JSON.stringify({ items }),
          showSuccessToast: true,
        },
      );
      setReceivePurchase(null);
      setSelectedMobilePurchase(null);
      await loadData(true);
    } catch (error) {
      console.error("Failed to receive purchase stock:", error);
    } finally {
      setIsActionSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {isActionSubmitting || (isRefreshing && !isLoading) ? (
        <div className="fixed bottom-20 left-4 right-4 z-[120] flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg md:hidden">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isActionSubmitting ? actionLabel : "Updating purchases…"}
        </div>
      ) : null}
      <PurchasesMobileView
        countries={mobileCountries}
        draftFilters={mobileDraftFilters}
        hasActiveFilters={hasActiveMobileFilters}
        hasMore={visibleMobilePurchases.length < filteredMobilePurchases.length}
        isLoading={isLoading}
        onAdd={() => setDrawer({ mode: "create" })}
        onApplyFilters={applyMobileFilters}
        onClearFilters={clearMobileFilters}
        onEdit={handleOpenEditPurchase}
        onFilterDraftChange={setMobileDraftFilters}
        onLoadMore={() => setMobileVisibleCount((count) => count + MOBILE_PAGE_SIZE)}
        onOpenDetails={setSelectedMobilePurchase}
        onReceiveStock={(purchase) => {
          setSelectedMobilePurchase(null);
          setReceivePurchase(purchase);
        }}
        onUpdatePayment={(purchase) => {
          setSelectedMobilePurchase(null);
          setPaymentPurchase(purchase);
        }}
        onUpdateSort={(sort) => {
          setMobileSort(sort);
          setMobileVisibleCount(MOBILE_PAGE_SIZE);
        }}
        selectedPurchase={selectedMobilePurchase}
        sort={mobileSort}
        suppliers={suppliers}
        visiblePurchases={visibleMobilePurchases}
      />
      <div className="hidden md:block">
        <CrudPageHeader
          title="Purchases"
          description="Manage product purchases, shipments, and landed costs."
          onAdd={() => setDrawer({ mode: "create" })}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          addLabel="Add Purchase"
        />
      </div>
      {isActionSubmitting || (isRefreshing && !isLoading) ? (
        <div className="hidden items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 md:flex">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isActionSubmitting ? actionLabel : "Updating purchases…"}
        </div>
      ) : null}
      <PurchasesList
        isLoading={isLoading}
        purchases={purchases}
        onAdd={() => setDrawer({ mode: "create" })}
        onEdit={handleOpenEditPurchase}
        onReceiveStock={setReceivePurchase}
        onUpdatePayment={setPaymentPurchase}
      />
      <PurchaseFormDrawer
        drawer={drawer}
        suppliers={suppliers}
        currencyRates={currencyRates}
        variants={variants}
        onClose={() => setDrawer(null)}
        onSuccess={handleSuccess}
      />
      <PurchasePaymentDrawer
        isSubmitting={isActionSubmitting}
        onClose={() => setPaymentPurchase(null)}
        onSubmit={handleUpdatePayment}
        purchase={paymentPurchase}
      />
      <PurchaseReceiveStockDrawer
        isSubmitting={isActionSubmitting}
        onClose={() => setReceivePurchase(null)}
        onSubmit={handleReceiveStock}
        purchase={receivePurchase}
      />
    </div>
  );
}
