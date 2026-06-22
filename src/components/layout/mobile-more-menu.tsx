"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CreditCard,
  Landmark,
  LineChart,
  ListTree,
  PackageSearch,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type DashboardUser = {
  name: string | null;
  email: string;
};

type MobileMoreMenuProps = {
  user: DashboardUser | null;
  trigger: ReactElement<{ onClick?: React.MouseEventHandler }>;
  onOpenChange?: (open: boolean) => void;
};

const GROUPS = [
  {
    label: "Inventory",
    items: [
      { label: "Products", href: "/inventory/products", icon: Boxes },
      { label: "Stock Movements", href: "/inventory/stock-movements", icon: PackageSearch },
      { label: "Stock Check", href: "/inventory/stock-check", icon: PackageSearch },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { label: "Purchases", href: "/purchasing/purchases", icon: ShoppingBag },
      { label: "Suppliers", href: "/purchasing/suppliers", icon: Users },
      { label: "Currency Rates", href: "/purchasing/currency-rates", icon: Landmark },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Expenses", href: "/finance/expenses", icon: CreditCard },
      { label: "Sales Summary", href: "/finance/sales-summary", icon: LineChart },
      { label: "Reports", href: "/finance/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Product Options", href: "/settings/product-options", icon: ListTree },
    ],
  },
];

export function MobileMoreMenu({
  user,
  trigger,
  onOpenChange,
}: MobileMoreMenuProps) {
  const [open, setOpen] = useState(false);

  function updateOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  return (
    <Sheet onOpenChange={updateOpen} open={open}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col" side="right">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Essentials by Zatab
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">More</h2>
          </div>
          <Button
            aria-label="Close menu"
            className="h-9 w-9 rounded-xl px-0"
            onClick={() => updateOpen(false)}
            variant="outline"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map(({ label, href, icon: Icon }) => (
                  <Link
                    className="flex min-h-20 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 shadow-sm"
                    href={href}
                    key={href}
                    onClick={() => updateOpen(false)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-border bg-card p-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-medium">{user?.name || "Authenticated User"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || "No user email"}
            </p>
          </div>
          <LogoutButton className="h-10 w-full rounded-xl" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
