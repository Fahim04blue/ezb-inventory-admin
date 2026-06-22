import type { LucideIcon } from "lucide-react";

export function MobileMetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone: string;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-2.5 shadow-[0_7px_18px_rgba(15,23,42,0.065)]">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="mt-1 text-[9px] font-medium leading-tight text-slate-500 min-[410px]:text-[10px]">{label}</p>
      <p className="mt-0.5 whitespace-nowrap text-[clamp(0.59rem,2.45vw,0.78rem)] font-semibold leading-tight tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[9px] text-slate-500">{helper}</p>
    </div>
  );
}
