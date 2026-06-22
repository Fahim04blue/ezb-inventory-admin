import { formatCurrency } from "@/lib/formatters";
import type { DashboardChartPoint } from "../types/dashboard.types";

export function DashboardChartCard({ data }: { data: DashboardChartPoint[] }) {
  const max = Math.max(...data.flatMap((point) => [Number(point.sales), Number(point.expenses)]), 0);
  return (
    <section className="h-auto w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-950">Last 7 Days Activity</h2><p className="mt-0.5 text-xs text-slate-500">Sales received vs operating expenses.</p></div><div className="flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Sales Received</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />Operating Expenses</span></div></div>
      {max === 0 ? <div className="flex h-48 items-center justify-center text-sm text-slate-500">No sales or expense activity in the last seven days.</div> : <div className="mt-4 grid h-56 grid-cols-7 items-end gap-2 rounded-xl bg-[linear-gradient(to_bottom,transparent_24%,#f1f5f9_25%,transparent_26%,transparent_49%,#f1f5f9_50%,transparent_51%,transparent_74%,#f1f5f9_75%,transparent_76%)] px-2 pt-3" aria-label="Sales versus expenses for the last seven days">{data.map((point) => <div key={point.key} className="flex h-full min-w-0 flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><div title={`Sales ${formatCurrency(point.sales)}`} className="w-3 rounded-t bg-emerald-600 sm:w-5" style={{ height: `${Math.max(Number(point.sales) ? 4 : 0, Number(point.sales) / max * 100)}%` }} /><div title={`Expenses ${formatCurrency(point.expenses)}`} className="w-3 rounded-t bg-amber-500 sm:w-5" style={{ height: `${Math.max(Number(point.expenses) ? 4 : 0, Number(point.expenses) / max * 100)}%` }} /></div><p className="mt-2 truncate text-center text-[11px] font-medium text-slate-500">{point.label}</p></div>)}</div>}
    </section>
  );
}
