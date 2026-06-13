import { prisma } from "@/lib/prisma";
import { SuppliersPageClient, type SupplierView } from "@/features/suppliers/components/suppliers-page-client";

async function getSuppliers(): Promise<SupplierView[]> {
  const suppliers = await prisma.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return suppliers.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    country: supplier.country,
    contactInfo: supplier.contactInfo,
    notes: supplier.notes,
    isActive: supplier.isActive,
  }));
}

export default async function SuppliersPage() {
  const initialSuppliers = await getSuppliers();

  return <SuppliersPageClient initialSuppliers={initialSuppliers} />;
}
