import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductVariantThumbnail } from "@/components/common/product-variant-thumbnail";
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
  imageUrl?: string | null;
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const listboxId = React.useId();
  const pickerRef = React.useRef<HTMLDivElement | null>(null);

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.id === value);
  }, [options, value]);

  const selectedLabel = selectedOption
    ? `${selectedOption.productName} - ${selectedOption.name}`
    : "";
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredOptions = normalizedSearch
    ? options.filter((option) =>
        [
          option.productName,
          option.name,
          option.sku,
          option.brandName,
          option.categoryName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : options;
  const inputValue = open ? searchQuery : selectedLabel;

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative z-30 min-w-0" ref={pickerRef}>
      <div
        className={cn(
          "flex h-10 min-w-0 w-full items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal shadow-sm transition focus-within:ring-2 focus-within:ring-ring",
          disabled && "bg-stone-50 text-stone-500",
          className,
        )}
      >
        {selectedOption && !open ? (
          <ProductVariantThumbnail
            imageUrl={selectedOption.imageUrl}
            alt={`${selectedOption.productName} ${selectedOption.name}`}
            className="h-7 w-7 rounded"
          />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-stone-400" />
        )}
        <input
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={disabled}
          onChange={(event) => {
            if (disabled) {
              return;
            }
            setSearchQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (disabled) {
              return;
            }
            setSearchQuery("");
            setOpen(true);
          }}
          placeholder="Search variant..."
          role="combobox"
          type="text"
          value={inputValue}
        />
        <Button
          aria-label={open ? "Close variant list" : "Open variant list"}
          disabled={disabled}
          onClick={() => {
            if (disabled) {
              return;
            }
            setSearchQuery("");
            setOpen((prev) => !prev);
          }}
          type="button"
          variant="outline"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-stone-500 shadow-none hover:bg-stone-100"
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>
      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-[170] mt-1.5 w-full overflow-hidden rounded-xl border border-stone-200 bg-white p-0 shadow-xl sm:min-w-[24rem]">
          <div
            className="max-h-[min(320px,45vh)] overflow-y-auto bg-white p-1 custom-scrollbar"
            id={listboxId}
            role="listbox"
          >
            {!filteredOptions.length ? (
              <div className="py-6 text-center text-sm text-stone-500">No variant found.</div>
            ) : null}
            {filteredOptions.length ? (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Product variants
                </div>
                <div className="space-y-1">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      aria-selected={value === option.id}
                      onClick={() => {
                        onChange(option.id === value ? undefined : option.id);
                        setSearchQuery("");
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg border p-2 text-left outline-none transition hover:border-stone-200 hover:bg-stone-50 focus-visible:border-stone-200 focus-visible:bg-stone-50",
                        value === option.id ? "border-stone-200 bg-stone-50" : "border-transparent",
                      )}
                      role="option"
                      type="button"
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <ProductVariantThumbnail
                            imageUrl={option.imageUrl}
                            alt={`${option.productName} ${option.name}`}
                            className="h-8 w-8 rounded-md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium leading-5 text-stone-950">
                              {option.productName} - {option.name}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-4 text-stone-500">
                              {option.sku ? <span>SKU: {option.sku}</span> : null}
                              {(option.brandName || option.categoryName) ? (
                                <span>{[option.brandName, option.categoryName].filter(Boolean).join(" • ")}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 text-emerald-700",
                            value === option.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-4 text-stone-600">
                        {option.suggestedSellingPrice ? (
                          <span>Price: {formatCurrency(option.suggestedSellingPrice)}</span>
                        ) : null}
                        {option.sizeValue ? (
                          <span>
                            Size: {option.sizeValue} {formatEnum(option.sizeUnit)}
                          </span>
                        ) : null}
                        {option.shippingWeightKg ? <span>Wt: {option.shippingWeightKg} kg</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
