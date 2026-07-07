import { SheinBatchItemStatus, SheinBatchStatus } from "@/lib/domain-enums";

const statusAliases: Record<string, string> = {
  "SHIPPED / IN CARGO": "IN_CARGO",
  "SHIPPED/IN CARGO": "IN_CARGO",
  "IN CARGO": "IN_CARGO",
  SHIPPED: "IN_CARGO",
  "MOVED TO ORDER": "MOVED_TO_ORDER",
  "READY FOR DELIVERY": "READY_FOR_DELIVERY",
  "PARTIALLY ARRIVED": "PARTIALLY_ARRIVED",
};

export const sheinStatusLabels: Record<string, string> = {
  CONFIRMED: "Confirmed",
  IN_CARGO: "Shipped / In Cargo",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
  READY_FOR_DELIVERY: "Ready For Delivery",
  PARTIALLY_ARRIVED: "Partially Arrived",
  WAITING: "Waiting",
  COMPLETED: "Completed",
  MOVED_TO_ORDER: "Moved To Order",
};

function normalizeRawStatus(status: unknown) {
  if (typeof status !== "string") return "";
  const trimmed = status.trim();
  if (!trimmed) return "";

  const canonical = trimmed.toUpperCase().replaceAll("-", "_").replace(/\s+/g, "_");
  return statusAliases[trimmed.toUpperCase()] ?? statusAliases[canonical.replaceAll("_", " ")] ?? canonical;
}

export function normalizeSheinBatchStatus(status: unknown): SheinBatchStatus {
  const normalized = normalizeRawStatus(status);
  return Object.values(SheinBatchStatus).includes(normalized as SheinBatchStatus)
    ? normalized as SheinBatchStatus
    : SheinBatchStatus.CONFIRMED;
}

export function normalizeSheinBatchItemStatus(status: unknown): SheinBatchItemStatus {
  const normalized = normalizeRawStatus(status);
  return Object.values(SheinBatchItemStatus).includes(normalized as SheinBatchItemStatus)
    ? normalized as SheinBatchItemStatus
    : SheinBatchItemStatus.CONFIRMED;
}

export function sheinStatusLabel(status: string) {
  const normalized = normalizeRawStatus(status);
  return sheinStatusLabels[normalized] ?? normalized.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
