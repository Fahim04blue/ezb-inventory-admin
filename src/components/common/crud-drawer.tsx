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
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export function CrudDrawer({
  open,
  onClose,
  title,
  description,
  children,
  className,
  headerClassName,
  bodyClassName,
}: CrudDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[130]">
      <button
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-full flex-col overflow-hidden border-l border-border bg-card shadow-xl",
          className,
        )}
      >
        <div className={cn("flex items-start justify-between gap-4 border-b border-border px-6 py-5", headerClassName)}>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight truncate">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground break-words">{description}</p>
            ) : null}
          </div>
          <Button className="h-10 w-10 px-0" onClick={onClose} type="button" variant="outline">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-6", bodyClassName)}>{children}</div>
      </aside>
    </div>
  );
}
