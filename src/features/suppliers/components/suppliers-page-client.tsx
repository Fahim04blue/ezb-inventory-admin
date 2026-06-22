"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { CrudPageHeader } from "@/components/common/crud-page-header";
import { SuppliersList } from "./suppliers-list";
import { SupplierFormDrawer } from "./supplier-form-drawer";
import { type DrawerState as SupplierDrawerState, type SupplierView } from "../types/supplier";

export function SuppliersPageClient() {
  const [suppliers, setSuppliers] = useState<SupplierView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawer, setDrawer] = useState<SupplierDrawerState>(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await apiClient<{ suppliers: SupplierView[] }>("/api/suppliers", {
        cache: "no-store",
        showErrorToast: false, // Let's not spam toasts on initial load
      });

      if (data?.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleStatus(supplier: SupplierView) {
    try {
      await apiClient<{ supplier: SupplierView }>(`/api/suppliers/${supplier.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !supplier.isActive }),
        showSuccessToast: true,
      });
      loadData(); // refresh list
    } catch (error) {
      // Handled by toast
    }
  }

  const handleSuccess = (message: string) => {
    setDrawer(null);
    loadData(true);
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <CrudPageHeader
        title="Suppliers"
        description="Manage product sources and business suppliers."
        onAdd={() => setDrawer({ mode: "create" })}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        addLabel="Add Supplier"
      />
      <SuppliersList
        isLoading={isLoading}
        suppliers={suppliers}
        onEdit={(supplier) => setDrawer({ mode: "edit", supplier })}
        onToggleStatus={handleToggleStatus}
      />
      <SupplierFormDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
