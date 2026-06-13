"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

type SheetTriggerProps = {
  asChild?: boolean;
  children: React.ReactElement<{
    onClick?: React.MouseEventHandler;
  }>;
};

type SheetContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "left" | "right";
};

type SheetContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);

  if (!context) {
    throw new Error("Sheet components must be used within Sheet.");
  }

  return context;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ asChild, children }: SheetTriggerProps) {
  const { onOpenChange } = useSheetContext();

  if (asChild) {
    return React.cloneElement(children, {
      onClick: (event: React.MouseEvent) => {
        children.props.onClick?.(event);
        onOpenChange(true);
      },
    });
  }

  return children;
}

export function SheetContent({
  className,
  side = "left",
  children,
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = useSheetContext();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-black/35"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div
        className={cn(
          "absolute top-0 h-full w-[88vw] max-w-xs bg-card shadow-xl",
          side === "left"
            ? "left-0 border-r border-border"
            : "right-0 border-l border-border",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
