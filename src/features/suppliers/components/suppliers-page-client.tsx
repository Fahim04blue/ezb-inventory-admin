"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Power, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CrudDrawer } from "@/components/common/crud-drawer";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { CardListSkeleton } from "@/components/common/card-list-skeleton";
import {
  createSupplierSchema,
  type CreateSupplierInput,
} from "@/features/suppliers/schemas/supplier-schemas";

export type SupplierView = {
  id: number;
  name: string;
  country: string | null;
  contactInfo: string | null;
  notes: string | null;
  isActive: boolean;
};

type ApiSuccess<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

type ApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

type DrawerState = { mode: "create" } | { mode: "edit"; supplier: SupplierView } | null;

function SupplierForm({
  mode,
  supplier,
  onSuccess,
}: {
  mode: "create" | "edit";
  supplier?: SupplierView;
  onSuccess: (message: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      country: supplier?.country ?? "",
      contactInfo: supplier?.contactInfo ?? "",
      notes: supplier?.notes ?? "",
      isActive: supplier?.isActive ?? true,
    },
  });

  async function onSubmit(values: CreateSupplierInput) {
    setSubmitError(null);
    const response = await fetch(
      mode === "create" ? "/api/suppliers" : `/api/suppliers/${supplier?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      },
    );

    const payload = (await response.json()) as ApiSuccess<{ supplier: SupplierView }> | ApiError;

    if (!response.ok || payload.status !== "success") {
      setSubmitError(payload.message || "Failed to save supplier.");
      return;
    }

    onSuccess(payload.message);
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input {...form.register("country")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Contact Info</Label>
        <Textarea {...form.register("contactInfo")} />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea {...form.register("notes")} />
      </div>
      <div className="flex items-end gap-2">
        <input className="h-4 w-4" type="checkbox" {...form.register("isActive")} />
        <Label>Active</Label>
      </div>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting
          ? "Saving..."
          : mode === "create"
            ? "Create Supplier"
            : "Save Supplier"}
      </Button>
    </form>
  );
}

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
      <PageHeader
        title="Suppliers"
        description="List suppliers first and manage them through a consistent right-side drawer."
        actions={
          <>
            <Button className="w-auto px-4" onClick={() => void loadSuppliers()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "create" })}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </>
        }
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

      {isLoading ? (
        <>
          <TableSkeleton columns={4} rows={6} />
          <CardListSkeleton cards={4} />
        </>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="pt-8">
            <p className="text-sm text-muted-foreground">
              No suppliers yet. Click Add Supplier to create the first one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
            <div className="grid grid-cols-[1.2fr_1fr_1.4fr_0.9fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
              <div>Supplier</div>
              <div>Country</div>
              <div>Contact Info</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-border">
              {suppliers.map((supplier) => (
                <div className="grid grid-cols-[1.2fr_1fr_1.4fr_0.9fr] gap-4 px-6 py-5" key={supplier.id}>
                  <div>
                    <p className="font-semibold">{supplier.name}</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${supplier.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{supplier.country || "Not set"}</div>
                  <div className="text-sm text-muted-foreground">{supplier.contactInfo || "Not set"}</div>
                  <div className="space-y-2">
                    <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "edit", supplier })} variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button className="w-auto px-4" onClick={() => void toggleSupplierStatus(supplier)} variant="outline">
                      <Power className="mr-2 h-4 w-4" />
                      {supplier.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:hidden">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{supplier.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{supplier.country || "No country"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${supplier.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{supplier.contactInfo || "No contact info"}</p>
                  {supplier.notes ? <p className="mt-2 text-sm text-muted-foreground">{supplier.notes}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button className="w-auto px-4" onClick={() => setDrawer({ mode: "edit", supplier })} variant="outline">
                      Edit
                    </Button>
                    <Button className="w-auto px-4" onClick={() => void toggleSupplierStatus(supplier)} variant="outline">
                      {supplier.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <CrudDrawer
        description={drawer?.mode === "create" ? "Add a supplier for future purchasing workflows." : "Update supplier details."}
        onClose={() => setDrawer(null)}
        open={drawer !== null}
        title={drawer?.mode === "create" ? "Add Supplier" : "Edit Supplier"}
      >
        {drawer?.mode === "create" ? (
          <SupplierForm mode="create" onSuccess={handleDrawerSuccess} />
        ) : null}
        {drawer?.mode === "edit" ? (
          <SupplierForm mode="edit" onSuccess={handleDrawerSuccess} supplier={drawer.supplier} />
        ) : null}
      </CrudDrawer>
    </div>
  );
}
