import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProductOptionsSectionCard({
  title,
  description,
  actionLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#dfd4c2] bg-[#fffaf1] p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <Button
          className="h-9 w-auto bg-[#1f5c4d] px-4 hover:bg-[#18493d]"
          onClick={onAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
