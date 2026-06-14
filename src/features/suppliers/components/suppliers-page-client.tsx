"use client";

import { useState } from "react";
import { SuppliersPageHeader } from "./suppliers-page-header";
import { SuppliersList } from "./suppliers-list";
import { SupplierFormDrawer } from "./supplier-form-drawer";
import { type SupplierView, type ApiSuccess, type ApiError, type DrawerState } from "../types/supplier";

export function SuppliersPageClient({
  initialSuppliers,
}: {
  initialSuppliers: SupplierView[];
}) {
  const [suppliers, setSuppliers] = useState<SupplierView[]>(initialSuppliers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  async function loadSuppliers() {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/suppliers", {
      credentials: "include",
      cache: "no-store",
    });
    const payload = (await response.json()) as
      | ApiSuccess<{ suppliers: SupplierView[] }>
      | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to load suppliers.");
      setIsLoading(false);
      return;
    }

    setSuppliers(payload.data.suppliers);
    setIsLoading(false);
  }

  async function toggleSupplierStatus(supplier: SupplierView) {
    const response = await fetch(`/api/suppliers/${supplier.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !supplier.isActive }),
    });
    const payload = (await response.json()) as ApiSuccess<{ supplier: SupplierView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setError(payload.message || "Failed to update supplier status.");
      return;
    }

    setSuccessMessage(payload.message);
    await loadSuppliers();
  }

  async function handleDrawerSuccess(message: string) {
    setDrawer(null);
    setSuccessMessage(message);
    await loadSuppliers();
  }

  return (
    <div className="space-y-6">
      <SuppliersPageHeader
        onRefresh={() => void loadSuppliers()}
        onAdd={() => setDrawer({ mode: "create" })}
      />

      {successMessage ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <SuppliersList
        isLoading={isLoading}
        suppliers={suppliers}
        onEdit={(supplier) => setDrawer({ mode: "edit", supplier })}
        onToggleStatus={(supplier) => void toggleSupplierStatus(supplier)}
      />

      <SupplierFormDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
