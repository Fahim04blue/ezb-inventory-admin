import type { ReactNode } from "react";

export function ReportsChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
