import { toNumber } from "@/lib/utils";

type NumberLike = number | string | { toString(): string };

const currencyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 2,
});

export function formatCurrency(value: NumberLike) {
  return currencyFormatter.format(toNumber(value));
}

export function formatNumber(value: NumberLike) {
  return numberFormatter.format(toNumber(value));
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatEnum(value: string | null | undefined): string {
  if (!value) return "";
  // Keep standard currency codes uppercase (BDT, USD, MYR, THB, CNY)
  if (["BDT", "USD", "MYR", "THB", "CNY"].includes(value.toUpperCase())) {
    return value.toUpperCase();
  }
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
