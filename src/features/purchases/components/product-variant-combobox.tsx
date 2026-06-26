import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type ProductVariantOption = {
  id: number;
  name: string;
  sku: string | null;
  productId: number;
  productName: string;
  brandName?: string | null;
  categoryName?: string | null;
  suggestedSellingPrice?: number | null;
  sizeValue?: number | null;
  sizeUnit?: string | null;
  shippingWeightKg?: number | null;
};

interface ProductVariantComboboxProps {
  options: ProductVariantOption[];
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function ProductVariantCombobox({
  options,
  value,
  onChange,
  disabled,
  className,
}: ProductVariantComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.id === value);
  }, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full min-w-0 justify-between gap-2 font-normal", className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-left">
                {selectedOption.productName} - {selectedOption.name}
              </span>
              {selectedOption.sku && (
                <span className="shrink-0 rounded border border-stone-200 bg-stone-50 px-1 text-xs text-stone-600">
                  {selectedOption.sku}
                </span>
              )}
            </div>
          ) : (
            <span className="truncate text-left text-muted-foreground">Select a variant...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className="z-[80] w-[min(36rem,calc(100vw-2rem),var(--radix-popover-trigger-width))] max-w-[calc(100vw-2rem)] overflow-hidden border-stone-200 bg-card p-0 shadow-xl"
      >
        <Command
          className="bg-card text-stone-900 [&_[cmdk-group]]:bg-card [&_[cmdk-input-wrapper]]:border-stone-200 [&_[cmdk-input-wrapper]]:bg-stone-50/70 [&_[cmdk-input]]:text-stone-900 [&_[cmdk-input]]:placeholder:text-stone-500"
          filter={(value, search) => {
            const opt = options.find((o) => o.id.toString() === value);
            if (!opt) return 0;

            const searchLower = search.toLowerCase();
            const matches = [
              opt.productName,
              opt.name,
              opt.sku,
              opt.brandName,
              opt.categoryName,
            ].some((val) => val?.toLowerCase().includes(searchLower));

            return matches ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search variants, products, SKU..." />
          <CommandList className="max-h-[320px] overflow-y-auto bg-card custom-scrollbar">
            <CommandEmpty className="bg-card text-stone-500">No variant found.</CommandEmpty>
            <CommandGroup className="bg-card p-1">
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id.toString()}
                  onSelect={(currentValue) => {
                    const selectedId = parseInt(currentValue, 10);
                    onChange(selectedId === value ? undefined : selectedId);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer flex-col items-start gap-1 rounded-md border border-transparent bg-card p-3 data-[selected=true]:border-stone-200 data-[selected=true]:bg-stone-100 hover:bg-stone-50"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="line-clamp-1 text-sm font-medium text-stone-900">
                      {option.productName} - {option.name}
                    </div>
                    {value === option.id && (
                      <Check className="ml-2 h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                    {option.sku && (
                      <span className="rounded border border-stone-200 bg-stone-50 px-1 font-mono text-[10px] text-stone-600">
                        SKU: {option.sku}
                      </span>
                    )}
                    {(option.brandName || option.categoryName) && (
                      <span>
                        {[option.brandName, option.categoryName].filter(Boolean).join(" • ")}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
                    {option.suggestedSellingPrice ? (
                      <span className="font-medium text-stone-900">
                        Price: {formatCurrency(option.suggestedSellingPrice)}
                      </span>
                    ) : null}
                    {option.sizeValue ? (
                      <span>
                        Size: {option.sizeValue} {formatEnum(option.sizeUnit)}
                      </span>
                    ) : null}
                    {option.shippingWeightKg ? <span>Wt: {option.shippingWeightKg} kg</span> : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
