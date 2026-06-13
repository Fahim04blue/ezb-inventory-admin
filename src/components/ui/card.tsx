import * as React from "react";

import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col gap-2 p-8 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: DivProps) {
  return (
    <div className={cn("text-2xl font-semibold tracking-tight", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: DivProps) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("p-8", className)} {...props} />;
}
