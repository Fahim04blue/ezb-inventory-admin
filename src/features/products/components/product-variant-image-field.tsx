"use client";

import { ImageIcon, X } from "lucide-react";
import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 3 * 1024 * 1024;

export type VariantImageState = {
  file: File | null;
  previewUrl: string | null;
  existingUrl: string | null;
  isRemoved: boolean;
  error: string | null;
};

export function createVariantImageState(existingUrl?: string | null): VariantImageState {
  return {
    file: null,
    previewUrl: null,
    existingUrl: existingUrl ?? null,
    isRemoved: false,
    error: null,
  };
}

export function validateVariantImageFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    return "Only JPG, PNG, and WEBP images are allowed.";
  }

  if (file.size > maxSize) {
    return "Image must be 3MB or smaller.";
  }

  return null;
}

export function ProductVariantImageField({
  id,
  state,
  onSelect,
  onRemove,
}: {
  id: string;
  state: VariantImageState;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const objectUrl = useMemo(
    () => (state.file ? URL.createObjectURL(state.file) : null),
    [state.file],
  );
  const previewUrl = objectUrl ?? state.previewUrl ?? (state.isRemoved ? null : state.existingUrl);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <div className="col-span-2 rounded-xl border border-border/70 bg-muted/10 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white text-muted-foreground">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
            Variant Image
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={id}
              accept="image/jpeg,image/png,image/webp"
              className="h-9 max-w-[220px] rounded-xl border-border/80 bg-white text-xs shadow-none"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onSelect(file);
                }
                event.target.value = "";
              }}
              type="file"
            />
            {previewUrl ? (
              <Button
                className="h-9 rounded-xl border-border bg-white px-3 text-xs shadow-none"
                onClick={onRemove}
                type="button"
                variant="outline"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Remove image
              </Button>
            ) : null}
          </div>
          <p className="text-[10px] text-muted-foreground">
            JPG, PNG, or WEBP. Max 3MB.
          </p>
          {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
        </div>
      </div>
    </div>
  );
}
