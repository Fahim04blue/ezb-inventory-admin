import { Button } from "@/components/ui/button";

export function ProductOptionsEmptyState({
  message,
  addLabel,
  onAdd,
}: {
  message: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#d8ccb9] bg-[#fffaf1] px-5 py-8 text-center">
      <p className="text-sm text-slate-600">{message}</p>
      <Button className="mt-4 h-9 w-auto bg-[#1f5c4d] px-4 hover:bg-[#18493d]" onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  );
}
