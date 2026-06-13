"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CrudDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function CrudDrawer({
  open,
  onClose,
  title,
  description,
  children,
}: CrudDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-border bg-card shadow-xl md:max-w-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button className="h-10 w-10 px-0" onClick={onClose} type="button" variant="outline">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </aside>
    </div>
  );
}
