"use client";

import * as React from "react";
import { createPortal } from "react-dom";

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

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] h-dvh w-screen overflow-hidden lg:hidden">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-black/35"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div
        aria-modal="true"
        className={cn(
          "absolute inset-y-0 h-dvh max-h-dvh w-[88vw] max-w-xs overflow-hidden bg-card shadow-xl",
          side === "left"
            ? "left-0 border-r border-border"
            : "right-0 border-l border-border",
          className,
        )}
        role="dialog"
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
