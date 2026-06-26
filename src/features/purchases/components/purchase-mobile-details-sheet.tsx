"use client";

import { Banknote, Package2, Pencil, Scale, Tag, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { PaymentStatusBadge } from "./payment-status-badge";
import { PurchaseStatusBadge } from "./purchase-status-badge";
import { type PurchaseView } from "../types/purchase.types";

function getTotalQuantity(purchase: PurchaseView) {
  return purchase.items.reduce((sum, item) => sum + item.quantity, 0);
}

function canReceiveStock(purchase: PurchaseView) {
  if (purchase.status === "CANCELLED") {
    return false;
  }

  return purchase.items.some((item) => item.receivedQuantity < item.quantity);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-1.5 text-[11px]">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-900">{value}</span>
    </div>
  );
}

export function PurchaseMobileDetailsSheet({
  onClose,
  onEdit,
  onReceiveStock,
  onUpdatePayment,
  open,
  purchase,
}: {
  onClose: () => void;
  onEdit: (purchase: PurchaseView) => void;
  onReceiveStock: (purchase: PurchaseView) => void;
  onUpdatePayment: (purchase: PurchaseView) => void;
  open: boolean;
  purchase: PurchaseView | null;
}) {
  if (!purchase) {
    return null;
  }

  const totalQty = getTotalQuantity(purchase);
  const receiveEnabled = canReceiveStock(purchase);
  const actionButtons = [
    purchase.paymentStatus !== "PAID"
      ? {
          key: "payment",
          label: "Update Payment",
          onClick: () => onUpdatePayment(purchase),
          variant: "outline" as const,
          className: "border-stone-200 bg-white text-stone-700",
        }
      : null,
    receiveEnabled
      ? {
          key: "receive",
          label: "Receive Stock",
          onClick: () => onReceiveStock(purchase),
          variant: "outline" as const,
          className: "border-stone-200 bg-white text-stone-700",
        }
      : null,
    {
      key: "edit",
      label: "Edit Purchase",
      onClick: () => onEdit(purchase),
      variant: "outline" as const,
      className: "border-emerald-200 bg-white text-emerald-800",
      icon: Pencil,
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    onClick: () => void;
    variant: "outline";
    className: string;
    icon?: typeof Pencil;
  }>;

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <DialogContent
        className="left-0 top-auto bottom-0 z-[120] h-[76dvh] max-h-[76dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[30px] border-stone-200 bg-[#fffdf8] p-0 shadow-[0_-18px_48px_rgba(15,23,42,0.22)]"
        showCloseButton={false}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-stone-200 px-4 pb-3 pt-3">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-stone-300" />
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="text-[1.1rem] font-semibold tracking-tight text-stone-950">
                  Purchase Details
                </DialogTitle>
                <p className="mt-1 text-[11px] text-stone-500">
                  {purchase.referenceNumber} • {purchase.supplier?.name || "Unknown Supplier"}
                </p>
              </div>
              <Button
                className="h-9 w-9 rounded-full border-stone-200 bg-white px-0 text-stone-600"
                onClick={onClose}
                type="button"
                variant="outline"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <PurchaseStatusBadge status={purchase.status} />
              <PaymentStatusBadge status={purchase.paymentStatus} />
              <span className="text-[10px] text-stone-500">{formatDate(purchase.purchaseDate)}</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
            <div className="space-y-3">
              {purchase.items.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-1 rounded-full bg-emerald-700" />
                        <p className="text-base font-semibold tracking-tight text-stone-950">
                          {item.productVariant.product.name} - {item.productVariant.name}
                        </p>
                      </div>
                      <p className="mt-1 pl-3 text-[11px] text-stone-500">
                        SKU: {item.productVariant.sku || "N/A"}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-800">
                      Qty {item.quantity} • Received {item.receivedQuantity}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-0 rounded-[20px] border border-stone-200 bg-[#fffdf8] min-[430px]:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                    <div className="p-3 min-[430px]:border-r min-[430px]:border-stone-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500">
                            <Tag className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <InfoRow label="Unit Price" value={formatNumber(item.unitPriceForeign)} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500">
                            <Banknote className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <InfoRow label="Product Cost" value={formatCurrency(Number(item.unitBuyingCostBdt))} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500">
                            <Scale className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <InfoRow label="Weight (kg)" value={item.shippingWeightKg ? formatNumber(item.shippingWeightKg) : "0"} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500">
                            <Wallet className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <InfoRow label="Cargo Cost" value={formatCurrency(Number(item.allocatedCargoCostBdt || 0))} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500">
                            <Package2 className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <InfoRow label="Other Cost" value={formatCurrency(Number(item.allocatedOtherCostBdt || 0))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                        <div className="grid grid-cols-2 divide-x divide-stone-200">
                          <div className="px-2.5 py-2.5">
                            <div className="flex items-center gap-2 text-stone-600">
                              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-stone-200 bg-[#fffdf8]">
                                <Tag className="h-3 w-3" />
                              </span>
                              <p className="text-[11px] text-stone-500">Final Unit Cost</p>
                            </div>
                            <p className="mt-1.5 text-[0.9rem] font-semibold text-emerald-800">
                              {formatCurrency(Number(item.finalUnitLandedCostBdt))}
                            </p>
                          </div>
                          <div className="px-2.5 py-2.5">
                            <div className="flex items-center gap-2 text-emerald-800">
                              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50">
                                <Wallet className="h-3 w-3" />
                              </span>
                              <p className="text-[11px] text-stone-500">Total Unit Cost</p>
                            </div>
                            <p className="mt-1.5 text-[0.9rem] font-semibold text-emerald-900">
                              {formatCurrency(Number(item.totalLandedCostBdt))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.15fr)] overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-sm">
                <div className="min-w-0 px-3 py-3 text-center">
                  <p className="text-[10px] text-stone-500">Total Qty</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">{totalQty} pcs</p>
                </div>
                <div className="min-w-0 border-x border-stone-200 px-3 py-3 text-center">
                  <p className="text-[10px] text-stone-500">Items</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">{purchase.items.length}</p>
                </div>
                <div className="min-w-0 px-3 py-3 text-center">
                  <p className="text-[10px] text-stone-500">Total Landed</p>
                  <p className="mt-1 truncate text-[1.05rem] font-semibold text-emerald-800">
                    {formatCurrency(Number(purchase.totalLandedCostBdt))}
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm">
                <div className="grid gap-x-4 gap-y-1 min-[390px]:grid-cols-2">
                  <InfoRow label="Purchase Currency" value={purchase.purchaseCurrency} />
                  <InfoRow label="Purchase Rate" value={formatNumber(purchase.purchaseExchangeRateToBdt)} />
                  <InfoRow label="Cargo Currency" value={purchase.cargoCurrency || "None"} />
                  <InfoRow label="Cargo Rate" value={purchase.cargoExchangeRateToBdt ? formatNumber(purchase.cargoExchangeRateToBdt) : "None"} />
                  <InfoRow label="Product Cost" value={formatCurrency(Number(purchase.productSubtotalBdt))} />
                  <InfoRow label="Cargo Cost" value={formatCurrency(Number(purchase.cargoChargeBdt || 0))} />
                  <InfoRow label="Other Import Cost" value={formatCurrency(Number(purchase.otherImportCostBdt || 0))} />
                  {purchase.notes ? <InfoRow label="Notes" value={purchase.notes} /> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-[#fffdf8] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <div
              className={cn(
                "grid gap-2",
                actionButtons.length === 1 && "grid-cols-1",
                actionButtons.length === 2 && "grid-cols-2",
                actionButtons.length >= 3 && "grid-cols-3",
              )}
            >
              {actionButtons.map((action) => {
                const Icon = action.icon;

                return (
                  <Button
                    key={action.key}
                    className={`h-10 min-w-0 rounded-xl px-2 text-[13px] ${action.className}`}
                    onClick={action.onClick}
                    type="button"
                    variant={action.variant}
                  >
                    {Icon ? <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" /> : null}
                    <span className="truncate">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
