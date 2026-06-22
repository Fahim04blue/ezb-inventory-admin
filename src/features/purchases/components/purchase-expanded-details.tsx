import { formatCurrency } from "@/lib/formatters";
import { type PurchaseView } from "../types/purchase.types";

export function PurchaseExpandedDetails({ purchase }: { purchase: PurchaseView }) {
  return (
    <div className="border-t border-stone-200 bg-[linear-gradient(180deg,rgba(235,227,213,0.62),rgba(255,253,248,0.96))] px-4 py-4">
      <div className="rounded-2xl border border-stone-200 bg-card shadow-sm">
        <div className="border-b border-stone-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
            Purchase Items
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-100/90 text-xs font-semibold text-stone-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Product Variant</th>
                <th className="px-4 py-2.5 font-semibold">SKU</th>
                <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">Received</th>
                <th className="px-4 py-2.5 text-right font-semibold">Unit Price</th>
                <th className="px-4 py-2.5 text-right font-semibold">Product Cost</th>
                <th className="px-4 py-2.5 text-right font-semibold">Weight (kg)</th>
                <th className="px-4 py-2.5 text-right font-semibold">Cargo Cost</th>
                <th className="px-4 py-2.5 text-right font-semibold">Other Cost</th>
                <th className="px-4 py-2.5 text-right font-semibold text-stone-950">Final Unit Cost</th>
                <th className="px-4 py-2.5 text-right font-semibold text-stone-950">Total Cost</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/90">
              {purchase.items.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-card hover:bg-stone-50/90" : "bg-stone-50/55 hover:bg-stone-100/70"}
                >
                  <td className="px-4 py-2.5 text-[13px] font-semibold text-stone-900">
                    {item.productVariant.product.name} - {item.productVariant.name}
                  </td>
                  <td className="px-4 py-2.5 text-[11px] font-mono text-stone-500">
                    {item.productVariant.sku || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-stone-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-stone-700">
                    {item.receivedQuantity}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-stone-700">
                    {Number(item.unitPriceForeign).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-stone-800">
                    {formatCurrency(Number(item.unitBuyingCostBdt))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-stone-600">
                    {item.shippingWeightKg || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-sky-800">
                    {formatCurrency(Number(item.allocatedCargoCostBdt))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-stone-600">
                    {formatCurrency(Number(item.allocatedOtherCostBdt))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-stone-950">
                    {formatCurrency(Number(item.finalUnitLandedCostBdt))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] font-bold text-emerald-900">
                    {formatCurrency(Number(item.totalLandedCostBdt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
