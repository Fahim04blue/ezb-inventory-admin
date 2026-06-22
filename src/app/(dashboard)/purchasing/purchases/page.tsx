import { PurchasesPageClient } from "@/features/purchases/components/purchases-page-client";

export const metadata = {
  title: "Purchases | Inventory Admin",
  description: "Manage purchase orders and supplier shipments.",
};

export default function PurchasesPage() {
  return <PurchasesPageClient />;
}
