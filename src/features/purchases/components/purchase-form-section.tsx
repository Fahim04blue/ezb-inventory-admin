import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PurchaseFormSection({
  title,
  icon,
  children,
  className,
  collapsible = false,
  collapsed = false,
  onToggle,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section className={cn("rounded-xl border border-stone-200 bg-white/95 shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-600">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-600 transition-colors hover:bg-stone-100"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
          </button>
        ) : null}
      </div>
      {!collapsed ? <div className="min-w-0 p-3">{children}</div> : null}
    </section>
  );
}
