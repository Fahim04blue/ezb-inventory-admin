"use client";

import { cn } from "@/lib/utils";
import type { ProductOptionsTab } from "../types/product-options";

const tabs: Array<{ id: ProductOptionsTab; label: string }> = [
  { id: "brands", label: "Brands" },
  { id: "categories", label: "Categories" },
];

export function ProductOptionsTabs({
  activeTab,
  onChange,
}: {
  activeTab: ProductOptionsTab;
  onChange: (tab: ProductOptionsTab) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 rounded-3xl border border-[#dfd4c2] bg-[#f5efe3] p-2">
        {tabs.map((tab) => (
          <button
            className={cn(
              "rounded-2xl border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "border-[#1f5c4d] bg-[#1f5c4d] text-white shadow-sm"
                : "border-[#ddd4c7] bg-[#fffaf1] text-slate-700 hover:bg-white",
            )}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
