"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SheinSkuCopy({
  sku,
  className,
}: {
  sku?: string | null;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const cleanSku = sku?.trim();

  if (!cleanSku) return null;
  const skuText = cleanSku;

  async function copySku(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(skuText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <span className={cn("inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className="truncate">SKU {skuText}</span>
      <Button
        aria-label={`Copy SKU ${skuText}`}
        className="h-5 w-5 shrink-0 rounded-md border-transparent px-0 text-muted-foreground shadow-none hover:bg-emerald-50 hover:text-emerald-700"
        onClick={copySku}
        type="button"
        variant="outline"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </span>
  );
}
