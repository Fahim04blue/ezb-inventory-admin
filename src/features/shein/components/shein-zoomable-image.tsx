/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SheinZoomableImage({
  src,
  alt,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label={`View full image for ${alt}`}
        className={cn(
          "cursor-zoom-in overflow-hidden rounded-lg ring-offset-background transition hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <img alt={alt} className={cn("h-full w-full object-cover", imageClassName)} loading="lazy" src={src} />
      </button>

      {open ? (
        <div aria-label={`Full image for ${alt}`} aria-modal="true" className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4" role="dialog">
          <button aria-label="Close image preview" className="absolute inset-0 cursor-zoom-out" onClick={() => setOpen(false)} type="button" />
          <div className="relative z-10 flex max-h-[94vh] max-w-[94vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">{alt}</p>
              <Button aria-label="Close image preview" className="h-8 w-8 shrink-0 px-0" onClick={() => setOpen(false)} variant="outline"><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex min-h-0 items-center justify-center bg-slate-50 p-3">
              <img alt={alt} className="max-h-[82vh] max-w-[90vw] object-contain" src={src} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
