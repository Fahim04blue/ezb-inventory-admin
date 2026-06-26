"use client";

import { cn } from "@/lib/utils";

export type RateManagementTab = "active-rates" | "rate-history" | "rate-types";

const tabs: Array<{ id: RateManagementTab; label: string }> = [
  { id: "active-rates", label: "Active Rates" },
  { id: "rate-history", label: "Rate History" },
  { id: "rate-types", label: "Rate Types" },
];

export function RateManagementTabs({
  activeTab,
  onChange,
}: {
  activeTab: RateManagementTab;
  onChange: (tab: RateManagementTab) => void;
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
