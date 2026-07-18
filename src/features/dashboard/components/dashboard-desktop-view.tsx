import type { DashboardOverview } from "../types/dashboard.types";
import { DashboardChartCard } from "./dashboard-chart-card";
import { DashboardLowStockCard } from "./dashboard-low-stock-card";
import { DashboardOrdersCard } from "./dashboard-orders-card";
import { DashboardPageHeader } from "./dashboard-page-header";
import { DashboardPreordersCard } from "./dashboard-preorders-card";
import {
  DashboardIncomingPurchasesCard,
  DashboardSupplierPaymentCard,
} from "./dashboard-purchases-card";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardRecentActivity } from "./dashboard-recent-activity";
import { DashboardSummaryCards } from "./dashboard-summary-cards";
import { DashboardTodaysFocus } from "./dashboard-todays-focus";

export function DashboardDesktopView({
  data,
}: {
  data: DashboardOverview;
}) {
  return (
    <div className="space-y-5">
      <DashboardPageHeader />
      <DashboardSummaryCards summary={data.summary} />
      <DashboardQuickActions />
      <DashboardTodaysFocus focus={data.focus} />
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <div className="contents xl:col-span-8 xl:flex xl:min-w-0 xl:flex-col xl:items-start xl:gap-4">
          <div className="order-1 w-full xl:order-none"><DashboardChartCard data={data.chart} /></div>
          <div className="order-2 w-full xl:order-none"><DashboardOrdersCard orders={data.ordersNeedingAction} /></div>
          <div className="order-3 w-full xl:order-none"><DashboardRecentActivity items={data.recentActivity} /></div>
          <div className="order-6 w-full xl:order-none"><DashboardIncomingPurchasesCard incoming={data.incomingPurchases.slice(0, 3)} /></div>
        </div>
        <div className="contents xl:col-span-4 xl:flex xl:min-w-0 xl:flex-col xl:items-start xl:gap-4">
          <div className="order-4 w-full xl:order-none"><DashboardPreordersCard preOrders={data.preOrders} /></div>
          <div className="order-5 w-full xl:order-none"><DashboardLowStockCard items={data.lowStock.slice(0, 5)} /></div>
          <div className="order-7 w-full xl:order-none"><DashboardSupplierPaymentCard paymentAttention={data.supplierPaymentAttention.slice(0, 3)} /></div>
        </div>
      </div>
    </div>
  );
}
