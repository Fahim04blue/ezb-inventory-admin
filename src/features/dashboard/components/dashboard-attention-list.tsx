import type { ReactNode } from "react";

export function DashboardAttentionList({ title, description, emptyMessage, isEmpty, children, action }: { title: string; description?: string; emptyMessage: string; isEmpty: boolean; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="h-auto w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div><h2 className="text-sm font-semibold text-slate-950">{title}</h2>{description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}</div>{action}
      </div>
      {isEmpty ? <p className="px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p> : children}
    </section>
  );
}
