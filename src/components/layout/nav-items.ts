import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  BarChart3,
  Boxes,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Landmark,
  ListTree,
  PackageSearch,
  ShoppingBag,
  Users,
  Waypoints,
} from "lucide-react";

export type NavGroupItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

export type NavGroup = {
  label: string;
  items: NavGroupItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        match: (pathname) => pathname === "/dashboard",
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Products",
        href: "/inventory/products",
        icon: Boxes,
        match: (pathname) =>
          pathname === "/inventory/products" ||
          pathname.startsWith("/inventory/products/"),
      },
      {
        label: "Stock Movements",
        href: "/inventory/stock-movements",
        icon: Waypoints,
        match: (pathname) =>
          pathname === "/inventory/stock-movements" ||
          pathname.startsWith("/inventory/stock-movements/"),
      },
      {
        label: "Stock Check",
        href: "/inventory/stock-check",
        icon: ClipboardCheck,
        match: (pathname) =>
          pathname === "/inventory/stock-check" ||
          pathname.startsWith("/inventory/stock-check/"),
      },
    ],
  },
  {
    label: "Purchasing",
    items: [
      {
        label: "Purchases",
        href: "/purchasing/purchases",
        icon: ShoppingBag,
        match: (pathname) =>
          pathname === "/purchasing/purchases" ||
          pathname.startsWith("/purchasing/purchases/"),
      },
      {
        label: "Receive Stock",
        href: "/purchasing/receive-stock",
        icon: ArrowDownToLine,
        match: (pathname) =>
          pathname === "/purchasing/receive-stock" ||
          pathname.startsWith("/purchasing/receive-stock/"),
      },
      {
        label: "Suppliers",
        href: "/purchasing/suppliers",
        icon: Users,
        match: (pathname) =>
          pathname === "/purchasing/suppliers" ||
          pathname.startsWith("/purchasing/suppliers/"),
      },
      {
        label: "Currency Rates",
        href: "/purchasing/currency-rates",
        icon: Landmark,
        match: (pathname) =>
          pathname === "/purchasing/currency-rates" ||
          pathname.startsWith("/purchasing/currency-rates/"),
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Orders",
        href: "/sales/orders",
        icon: PackageSearch,
        match: (pathname) =>
          pathname === "/sales/orders" || pathname.startsWith("/sales/orders/"),
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Expenses",
        href: "/finance/expenses",
        icon: CreditCard,
        match: (pathname) =>
          pathname === "/finance/expenses" ||
          pathname.startsWith("/finance/expenses/"),
      },
      {
        label: "Reports",
        href: "/finance/reports",
        icon: BarChart3,
        match: (pathname) =>
          pathname === "/finance/reports" ||
          pathname.startsWith("/finance/reports/"),
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "Product Options",
        href: "/settings/product-options",
        icon: ListTree,
        match: (pathname) =>
          pathname === "/settings/product-options" ||
          pathname.startsWith("/settings/product-options/"),
      },
    ],
  },
];
