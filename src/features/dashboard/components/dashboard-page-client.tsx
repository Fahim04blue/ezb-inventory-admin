"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { DashboardOverview } from "../types/dashboard.types";
import { DashboardDesktopView } from "./dashboard-desktop-view";
import { DashboardMobileView } from "./dashboard-mobile-view";

async function fetchDashboard() {
  return apiClient<DashboardOverview>("/api/dashboard/overview", { cache: "no-store" });
}

function DashboardSkeleton() {
  return <div className="space-y-3"><div className="h-40 animate-pulse rounded-3xl bg-slate-200/80 md:h-24" /><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{Array.from({ length: 4 }).map((_, index) => <div className="h-28 animate-pulse rounded-2xl bg-white" key={index} />)}</div></div>;
}

export function DashboardPageClient() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchDashboard();
        if (!cancelled) setData(result);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full min-w-0">
      {isLoading && !data ? <DashboardSkeleton /> : data ? <>
        <DashboardMobileView data={data} />
        <div className="hidden md:block">
          <DashboardDesktopView data={data} />
        </div>
      </> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Dashboard could not be loaded.</div>}
    </div>
  );
}
