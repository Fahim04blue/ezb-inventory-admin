import type { ReactNode } from "react";

export function ReportsTableCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}
