"use client"

import type { CSSProperties } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      theme="light"
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600" />,
        info: <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600" />,
        error: <OctagonXIcon className="size-4 text-red-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-slate-600" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "border-slate-200 bg-white text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.16)]",
          title: "text-sm font-semibold text-slate-950",
          description: "text-sm text-slate-600",
          closeButton: "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "#e2e8f0",
          "--border-radius": "12px",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
