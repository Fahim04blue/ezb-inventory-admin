"use client";

import { useState, useCallback, useEffect } from "react";
import { PaymentStatus } from "@prisma/client";
import { apiClient } from "@/lib/api-client";
import { CrudPageHeader } from "@/components/common/crud-page-header";
import { PurchasesList } from "./purchases-list";
import { PurchaseFormDrawer } from "./purchase-form-drawer";
import { PurchasePaymentDrawer } from "./purchase-payment-drawer";
import { PurchaseReceiveStockDrawer } from "./purchase-receive-stock-drawer";
import { type PurchaseView, type PurchaseDrawerState } from "../types/purchase.types";

export function PurchasesPageClient() {
  const [purchases, setPurchases] = useState<PurchaseView[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [currencyRates, setCurrencyRates] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [drawer, setDrawer] = useState<PurchaseDrawerState>(null);
  const [paymentPurchase, setPaymentPurchase] = useState<PurchaseView | null>(null);
  const [receivePurchase, setReceivePurchase] = useState<PurchaseView | null>(null);

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

  const handleSuccess = (message: string) => {
    setDrawer(null);
    loadData(true);
  };

  async function handleUpdatePayment(purchase: PurchaseView, paymentStatus: PaymentStatus) {
    setIsActionSubmitting(true);

    try {
      await apiClient<{ purchase: PurchaseView }>(`/api/purchases/${purchase.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
        showSuccessToast: true,
      });
      setPaymentPurchase(null);
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
      await loadData(true);
    } catch (error) {
      console.error("Failed to receive purchase stock:", error);
    } finally {
      setIsActionSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <CrudPageHeader
        title="Purchases"
        description="Manage product purchases, shipments, and landed costs."
        onAdd={() => setDrawer({ mode: "create" })}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        addLabel="Add Purchase"
      />
      <PurchasesList
        isLoading={isLoading}
        purchases={purchases}
        onAdd={() => setDrawer({ mode: "create" })}
        onEdit={(purchase) => setDrawer({ mode: "edit", purchase })}
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
