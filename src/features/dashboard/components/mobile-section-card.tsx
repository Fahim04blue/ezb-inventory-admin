import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function MobileSectionCard({
  title,
  subtitle,
  href,
  empty,
  emptyMessage,
  children,
}: {
  title: string;
  subtitle?: string;
  href: string;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.065)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-0.5 truncate text-[11px] text-slate-500">{subtitle}</p> : null}
        </div>
        <Link className="flex shrink-0 items-center text-[11px] font-medium text-primary" href={href}>
          View all <ChevronRight className="ml-0.5 h-3 w-3" />
        </Link>
      </div>
      {empty ? <p className="px-4 py-6 text-center text-xs text-slate-500">{emptyMessage}</p> : children}
    </section>
  );
}
