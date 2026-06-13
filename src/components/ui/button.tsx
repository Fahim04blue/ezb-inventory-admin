import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

export function Button({
  className,
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "outline" &&
          "border border-border bg-card text-foreground hover:bg-muted",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
