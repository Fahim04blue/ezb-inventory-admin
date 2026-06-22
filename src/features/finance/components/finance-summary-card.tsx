import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FinanceSummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
  className?: string;
}

export function FinanceSummaryCard({
  title,
  value,
  icon,
  subtitle,
  className,
}: FinanceSummaryCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-3xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
