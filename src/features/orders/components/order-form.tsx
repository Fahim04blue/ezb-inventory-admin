"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ClipboardList,
  Minus,
  Loader2,
  NotebookPen,
  Package2,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  OrderItemFulfillmentStatus,
  OrderSource,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from "@/lib/domain-enums";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ProductVariantThumbnail } from "@/components/common/product-variant-thumbnail";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatEnum } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  createOrderSchema,
  type CreateOrderInput,
} from "../schemas/order.schema";
import type {
  OrderVariantOption,
  OrderView,
  PreOrderPurchaseItemOption,
} from "../types/order.types";

type OrderFormValues = z.input<typeof createOrderSchema>;

type OrderFormProps = {
  variantOptions: OrderVariantOption[];
  preOrderPurchaseItems: PreOrderPurchaseItemOption[];
  isSubmitting: boolean;
  order?: OrderView | null;
  initialOrderType?: OrderType | null;
  initialPurchaseItemId?: number | null;
  onSubmit: (input: CreateOrderInput) => Promise<void>;
  onCancel: () => void;
};

const today = new Date().toISOString().slice(0, 10);
type ItemSource = "INCOMING_PURCHASE" | "CURRENT_STOCK";
type SectionKey =
  | "orderDetails"
  | "customer"
  | "items"
  | "charges"
  | "summary"
  | "notes";

function emptyItem(isPreOrder = false) {
  return {
    source: (isPreOrder ? "INCOMING_PURCHASE" : "CURRENT_STOCK") as ItemSource,
    productVariantId: 0,
    purchaseItemId: null,
    quantity: 1,
    unitSellingPrice: 0,
    unitCost: 0,
  };
}

function getDefaultValues(
  order?: OrderView | null,
  initialPurchaseItem?: PreOrderPurchaseItemOption | null,
  initialOrderType?: OrderType | null,
): OrderFormValues {
  if (!order) {
    const orderType = initialPurchaseItem
      ? OrderType.PRE_ORDER
      : initialOrderType ?? OrderType.NORMAL;
    const isPreOrder = orderType === OrderType.PRE_ORDER;

    return {
      orderType,
      status: isPreOrder ? OrderStatus.PRE_ORDERED : OrderStatus.CONFIRMED,
      orderDate: today,
      source: OrderSource.FACEBOOK,
      paymentStatus: PaymentStatus.UNPAID,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      paidAmount: undefined,
      amountReceived: isPreOrder ? 0 : undefined,
      discountAmount: 0,
      deliveryCharge: 0,
      courierDeduction: 0,
      notes: "",
      items: [
        initialPurchaseItem
          ? {
              source: "INCOMING_PURCHASE" as const,
              productVariantId: initialPurchaseItem.productVariantId,
              purchaseItemId: initialPurchaseItem.id,
              quantity: 1,
              unitSellingPrice: Number(initialPurchaseItem.suggestedSellingPrice || 0),
              unitCost: Number(initialPurchaseItem.finalUnitLandedCostBdt || 0),
            }
          : emptyItem(isPreOrder),
      ],
    };
  }

  return {
    orderType: order.orderType,
    status: order.status,
    orderDate: order.orderDate.slice(0, 10),
    source: order.source,
    paymentStatus: order.paymentStatus,
    customerName: order.customerName ?? "",
    customerPhone: order.customerPhone ?? "",
    customerAddress: order.customerAddress ?? "",
    paidAmount: undefined,
    amountReceived: Number(order.amountReceived),
    discountAmount: Number(order.discountAmount),
    deliveryCharge: Number(order.deliveryCharge),
    courierDeduction: Number(order.courierDeduction),
    notes: order.notes ?? "",
    items: order.items.map((item) => ({
      orderItemId: item.id,
      source: (item.purchaseItemId
        ? "INCOMING_PURCHASE"
        : "CURRENT_STOCK") as ItemSource,
      productVariantId: item.productVariantId,
      purchaseItemId: item.purchaseItemId,
      quantity: item.quantity,
      unitSellingPrice: Number(item.unitSellingPrice),
      unitCost: Number(item.unitCost),
    })),
  };
}

function getAutomaticAmountReceivedForOrder(order?: OrderView | null) {
  if (!order || order.orderType === OrderType.PRE_ORDER) {
    return 0;
  }

  return (
    Number(order.customerPayable || 0) +
    Number(order.deliveryCharge || 0) -
    Number(order.courierDeduction || 0)
  );
}

function hasManualAmountReceived(order?: OrderView | null) {
  if (!order) {
    return false;
  }

  if (order.orderType === OrderType.PRE_ORDER) {
    return Number(order.amountReceived) > 0;
  }

  return (
    Math.abs(Number(order.amountReceived || 0) - getAutomaticAmountReceivedForOrder(order)) >
    0.009
  );
}

function optionLabel(option: OrderVariantOption) {
  return `${option.productName} - ${option.variantName}${
    option.sku ? ` (${option.sku})` : ""
  }`;
}

function purchaseItemLabel(option: PreOrderPurchaseItemOption) {
  return `${option.productName} - ${option.variantName} • ${
    option.country ?? "Unknown country"
  } • ${option.purchaseRef}`;
}

function isLockedPreOrderItemStatus(status: OrderItemFulfillmentStatus) {
  return (
    status === OrderItemFulfillmentStatus.MOVED_TO_ORDER ||
    status === OrderItemFulfillmentStatus.IN_DELIVERY ||
    status === OrderItemFulfillmentStatus.DELIVERED ||
    status === OrderItemFulfillmentStatus.CANCELLED ||
    status === OrderItemFulfillmentStatus.RETURNED
  );
}

function lockedPreOrderItemMessage(item: OrderView["items"][number]) {
  if (item.fulfillmentStatus === OrderItemFulfillmentStatus.MOVED_TO_ORDER) {
    return item.transferredToOrderNumber
      ? `Moved to ${item.transferredToOrderNumber}`
      : "Moved to a normal order";
  }

  if (item.fulfillmentStatus === OrderItemFulfillmentStatus.IN_DELIVERY) {
    return "In delivery";
  }

  if (item.fulfillmentStatus === OrderItemFulfillmentStatus.DELIVERED) {
    return "Delivered to customer";
  }

  return formatEnum(item.fulfillmentStatus);
}

type OrderItemPickerProps = {
  useIncomingPurchase: boolean;
  disabled?: boolean;
  productVariantId?: number | null;
  purchaseItemId?: number | null;
  quantity?: number;
  unitSellingPrice?: number;
  variantOptions: OrderVariantOption[];
  preOrderPurchaseItems: PreOrderPurchaseItemOption[];
  onSelectVariant: (value: string) => void;
  onSelectPurchaseItem: (value: string) => void;
};

function OrderItemPicker({
  useIncomingPurchase,
  disabled = false,
  productVariantId,
  purchaseItemId,
  quantity = 1,
  unitSellingPrice = 0,
  variantOptions,
  preOrderPurchaseItems,
  onSelectVariant,
  onSelectPurchaseItem,
}: OrderItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const listboxId = useId();
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectablePurchaseItems = preOrderPurchaseItems.filter(
    (option) =>
      option.availableIncomingQuantity > 0 || option.id === Number(purchaseItemId || 0),
  );
  const selectedIncoming = useIncomingPurchase
    ? selectablePurchaseItems.find((option) => option.id === Number(purchaseItemId || 0))
    : null;
  const selectedVariant = variantOptions.find(
    (option) => option.id === Number(productVariantId || 0),
  );
  const stockOptions = variantOptions.filter(
    (option) => option.currentStock > 0 || option.id === Number(productVariantId || 0),
  );
  const selectedLabel = useIncomingPurchase
    ? selectedIncoming
      ? purchaseItemLabel(selectedIncoming)
      : ""
    : selectedVariant
      ? optionLabel(selectedVariant)
      : "";
  const normalizedSearch = searchQuery.trim().toLowerCase();

  function incomingSearchText(option: PreOrderPurchaseItemOption) {
    return [
      option.productName,
      option.variantName,
      option.sku,
      option.purchaseRef,
      option.supplierName,
      option.country,
      option.purchaseStatus,
      "incoming",
      "purchase",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function stockSearchText(option: OrderVariantOption) {
    return [
      option.productName,
      option.variantName,
      option.sku,
      "current stock",
      "stock",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  const filteredPurchaseItems = normalizedSearch
    ? selectablePurchaseItems.filter((option) =>
        incomingSearchText(option).includes(normalizedSearch),
      )
    : selectablePurchaseItems;
  const filteredStockOptions = normalizedSearch
    ? stockOptions.filter((option) => stockSearchText(option).includes(normalizedSearch))
    : stockOptions;
  const hasResults = useIncomingPurchase
    ? filteredPurchaseItems.length > 0
    : filteredStockOptions.length > 0;
  const inputValue = open ? searchQuery : selectedLabel;
  const placeholder = useIncomingPurchase
    ? "Search incoming purchase batch"
    : "Search product";

  useEffect(() => {
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
          "flex h-10 min-w-0 w-full items-center gap-2 rounded-xl border border-input bg-white px-3 text-sm font-normal shadow-sm transition focus-within:ring-2 focus-within:ring-ring",
          disabled && "bg-slate-50 text-slate-500",
        )}
      >
        {selectedLabel && !open ? (
          <ProductVariantThumbnail
            imageUrl={useIncomingPurchase ? selectedIncoming?.imageUrl : selectedVariant?.imageUrl}
            alt={selectedLabel}
            className="h-7 w-7 rounded"
          />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
        )}
        <input
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
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
          placeholder={placeholder}
          role="combobox"
          type="text"
          value={inputValue}
          disabled={disabled}
        />
        <button
          aria-label={open ? "Close product list" : "Open product list"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          onClick={() => {
            if (disabled) {
              return;
            }
            setSearchQuery("");
            setOpen((prev) => !prev);
          }}
          disabled={disabled}
          type="button"
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </button>
      </div>
      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-[170] mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl sm:min-w-[18rem]">
          <div
            className="max-h-[min(280px,45vh)] overflow-y-auto bg-white p-1 custom-scrollbar"
            id={listboxId}
            role="listbox"
          >
            {!hasResults ? (
              <div className="py-6 text-center text-sm text-slate-500">
                {useIncomingPurchase ? "No incoming batch found." : "No in-stock product found."}
              </div>
            ) : null}
            {useIncomingPurchase && filteredPurchaseItems.length ? (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Incoming purchase items
                </div>
                <div className="space-y-1">
                  {filteredPurchaseItems.map((option) => (
                    <button
                      key={`incoming-${option.id}`}
                      aria-selected={selectedIncoming?.id === option.id}
                      onClick={() => {
                        onSelectPurchaseItem(String(option.id));
                        setSearchQuery("");
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg border p-2 text-left outline-none transition hover:border-amber-200 hover:bg-amber-50 focus-visible:border-amber-200 focus-visible:bg-amber-50",
                        selectedIncoming?.id === option.id
                          ? "border-amber-200 bg-amber-50"
                          : "border-transparent",
                      )}
                      type="button"
                      role="option"
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <ProductVariantThumbnail
                            imageUrl={option.imageUrl}
                            alt={`${option.productName} ${option.variantName}`}
                            className="h-8 w-8 rounded-md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium leading-5 text-slate-950">
                              {option.productName} - {option.variantName}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-4 text-slate-500">
                              <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0 text-amber-800">
                                Incoming
                              </span>
                              {option.country ? <span>{option.country}</span> : null}
                              <span className="truncate">{option.purchaseRef}</span>
                              <span>{formatEnum(option.purchaseStatus)}</span>
                              {option.supplierName ? <span className="truncate">{option.supplierName}</span> : null}
                              {option.sku ? <span className="truncate">SKU: {option.sku}</span> : null}
                            </div>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 text-emerald-700",
                            selectedIncoming?.id === option.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-4 text-slate-600">
                        <span>Available: {option.availableIncomingQuantity}</span>
                        <span>Cost: {formatCurrency(Number(option.finalUnitLandedCostBdt))}</span>
                        <span>
                          Expected profit:{" "}
                          {formatCurrency(
                            (Number(unitSellingPrice) -
                              Number(option.finalUnitLandedCostBdt || 0)) *
                              Number(quantity || 0),
                          )}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {!useIncomingPurchase && filteredStockOptions.length ? (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Products
                </div>
                <div className="space-y-1">
                  {filteredStockOptions.map((option) => (
                    <button
                      key={`stock-${option.id}`}
                      aria-selected={selectedVariant?.id === option.id}
                      onClick={() => {
                        onSelectVariant(String(option.id));
                        setSearchQuery("");
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg border p-2 text-left outline-none transition hover:border-slate-200 hover:bg-slate-50 focus-visible:border-slate-200 focus-visible:bg-slate-50",
                        selectedVariant?.id === option.id
                          ? "border-slate-200 bg-slate-50"
                          : "border-transparent",
                      )}
                      type="button"
                      role="option"
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <ProductVariantThumbnail
                            imageUrl={option.imageUrl}
                            alt={`${option.productName} ${option.variantName}`}
                            className="h-8 w-8 rounded-md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium leading-5 text-slate-950">
                              {option.productName} - {option.variantName}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-4 text-slate-500">
                              {option.sku ? <span>SKU: {option.sku}</span> : null}
                            </div>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 text-emerald-700",
                            selectedVariant?.id === option.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-4 text-slate-600">
                        <span>Stock: {option.currentStock}</span>
                        <span>Cost: {formatCurrency(Number(option.currentLandedCost || 0))}</span>
                        {option.defaultSellingPrice ? (
                          <span>Sell: {formatCurrency(Number(option.defaultSellingPrice))}</span>
                        ) : null}
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

function SectionCard({
  icon: Icon,
  title,
  isOpen,
  onToggle,
  children,
}: {
  icon: typeof ClipboardList;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-[22px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[1.02rem] font-semibold tracking-tight text-slate-950">
            {title}
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        )}
      </button>
      {isOpen ? <div className="border-t border-slate-200/80 px-4 py-4">{children}</div> : null}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
  positive = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={emphasized ? "font-semibold text-slate-950" : "text-slate-600"}>
        {label}
      </span>
      <span
        className={cn(
          emphasized ? "font-semibold" : "font-medium",
          positive ? "text-emerald-700" : "text-slate-950",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function OrderForm({
  variantOptions,
  preOrderPurchaseItems,
  isSubmitting,
  order,
  initialOrderType,
  initialPurchaseItemId,
  onSubmit,
  onCancel,
}: OrderFormProps) {
  const initialPurchaseItem = useMemo(
    () =>
      initialPurchaseItemId
        ? preOrderPurchaseItems.find((item) => item.id === initialPurchaseItemId) ?? null
        : null,
    [initialPurchaseItemId, preOrderPurchaseItems],
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<OrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: getDefaultValues(order, initialPurchaseItem, initialOrderType),
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const orderType = useWatch({ control, name: "orderType" });
  const status = useWatch({ control, name: "status" });
  const source = useWatch({ control, name: "source" });
  const paymentStatus = useWatch({ control, name: "paymentStatus" });
  const watchedItems = useWatch({ control, name: "items" });
  const isPreOrder = orderType === OrderType.PRE_ORDER;
  const discountAmount = Number(useWatch({ control, name: "discountAmount" }) || 0);
  const deliveryCharge = Number(useWatch({ control, name: "deliveryCharge" }) || 0);
  const courierDeduction = Number(useWatch({ control, name: "courierDeduction" }) || 0);
  const amountReceived = useWatch({ control, name: "amountReceived" });
  const previousOrderType = useRef<OrderType | undefined>(orderType as OrderType);
  const [amountReceivedOverride, setAmountReceivedOverride] = useState<{
    orderId: number | null;
    isManual: boolean;
  } | null>(null);
  const amountReceivedOrderId = order?.id ?? null;
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    orderDetails: true,
    customer: true,
    items: true,
    charges: true,
    summary: true,
    notes: true,
  });
  const initialAmountReceivedManual = useMemo(
    () => hasManualAmountReceived(order),
    [order],
  );
  const isAmountReceivedManual =
    amountReceivedOverride?.orderId === amountReceivedOrderId
      ? amountReceivedOverride.isManual
      : initialAmountReceivedManual;

  useEffect(() => {
    const values = getDefaultValues(order, initialPurchaseItem, initialOrderType);
    reset(values);
    previousOrderType.current = values.orderType as OrderType;
  }, [initialOrderType, initialPurchaseItem, order, reset]);

  useEffect(() => {
    if (!previousOrderType.current) {
      previousOrderType.current = orderType as OrderType;
      return;
    }

    if (previousOrderType.current !== orderType) {
      replace([emptyItem(orderType === OrderType.PRE_ORDER)]);
      if (!order) {
        setValue(
          "status",
          orderType === OrderType.PRE_ORDER
            ? OrderStatus.PRE_ORDERED
            : OrderStatus.CONFIRMED,
          { shouldValidate: true },
        );
      }
      previousOrderType.current = orderType as OrderType;
    }
  }, [order, orderType, replace, setValue]);


  const totals = useMemo(() => {
    const subtotal = (watchedItems ?? []).reduce((sum, item) => {
      return sum + Number(item?.quantity || 0) * Number(item?.unitSellingPrice || 0);
    }, 0);
    const productCost = (watchedItems ?? []).reduce((sum, item) => {
      return sum + Number(item?.quantity || 0) * Number(item?.unitCost || 0);
    }, 0);
    const customerPayable = Math.max(0, isPreOrder ? subtotal : subtotal - discountAmount);
    const automaticAmountReceived = Math.max(
      0,
      isPreOrder ? 0 : customerPayable + deliveryCharge - courierDeduction,
    );
    const received =
      amountReceived == null || Number.isNaN(Number(amountReceived))
        ? automaticAmountReceived
        : Number(amountReceived);
    const grossProfit = customerPayable - productCost;
    const netProfit = isPreOrder ? grossProfit : received - productCost;
    const dueAmount = Math.max(
      0,
      isPreOrder
        ? customerPayable - received
        : automaticAmountReceived - received,
    );

    return {
      subtotal,
      productCost,
      customerPayable,
      deliveryCharge,
      discountAmount,
      courierDeduction,
      automaticAmountReceived,
      received,
      grossProfit,
      netProfit,
      dueAmount,
    };
  }, [
    amountReceived,
    courierDeduction,
    deliveryCharge,
    discountAmount,
    isPreOrder,
    watchedItems,
  ]);

  useEffect(() => {
    if (!isAmountReceivedManual) {
      setValue("amountReceived", totals.automaticAmountReceived, {
        shouldValidate: true,
      });
    }
  }, [isAmountReceivedManual, setValue, totals.automaticAmountReceived]);

  async function submit(values: OrderFormValues) {
    const parsed = createOrderSchema.parse({
      ...values,
      amountReceived: isPreOrder
        ? values.amountReceived ?? 0
        : isAmountReceivedManual
          ? values.amountReceived
          : totals.automaticAmountReceived,
    });
    await onSubmit(parsed);
  }

  function handleVariantSelect(index: number, value: string) {
    const variant = variantOptions.find((item) => item.id === Number(value));

    if (!variant) {
      return;
    }

    setValue(`items.${index}.productVariantId`, variant.id, { shouldValidate: true });
    setValue(`items.${index}.source`, "CURRENT_STOCK", { shouldValidate: true });
    setValue(`items.${index}.purchaseItemId`, null);
    setValue(`items.${index}.unitCost`, Number(variant.currentLandedCost || 0));
    setValue(
      `items.${index}.unitSellingPrice`,
      Number(variant.defaultSellingPrice || 0),
      { shouldValidate: true },
    );
  }

  function handlePurchaseItemSelect(index: number, value: string) {
    const purchaseItem = preOrderPurchaseItems.find((item) => item.id === Number(value));

    if (!purchaseItem) {
      return;
    }

    setValue(`items.${index}.purchaseItemId`, purchaseItem.id, {
      shouldValidate: true,
    });
    setValue(`items.${index}.source`, "INCOMING_PURCHASE", {
      shouldValidate: true,
    });
    setValue(`items.${index}.productVariantId`, purchaseItem.productVariantId, {
      shouldValidate: true,
    });
    setValue(
      `items.${index}.unitCost`,
      Number(purchaseItem.finalUnitLandedCostBdt || 0),
    );
    setValue(
      `items.${index}.unitSellingPrice`,
      Number(purchaseItem.suggestedSellingPrice || 0),
      { shouldValidate: true },
    );
  }

  function handleAmountReceivedChange() {
    setAmountReceivedOverride({ orderId: amountReceivedOrderId, isManual: true });
  }

  function toggleSection(section: SectionKey) {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function handleItemSourceChange(index: number, value: string) {
    const nextSource = value as ItemSource;
    setValue(`items.${index}.source`, nextSource, { shouldValidate: true });
    setValue(`items.${index}.purchaseItemId`, null, { shouldValidate: true });

    if (nextSource === "CURRENT_STOCK") {
      const variantId = Number(watchedItems?.[index]?.productVariantId || 0);
      const variant = variantOptions.find((option) => option.id === variantId);
      setValue(
        `items.${index}.unitCost`,
        Number(variant?.currentLandedCost || 0),
      );
    }
  }

  function handleOrderTypeChange(value: string) {
    const nextOrderType = value as OrderType;

    setValue("orderType", nextOrderType, { shouldValidate: true });

    if (nextOrderType === OrderType.PRE_ORDER) {
      setAmountReceivedOverride({ orderId: amountReceivedOrderId, isManual: false });
      replace([emptyItem(true)]);
      previousOrderType.current = nextOrderType;
      setValue("deliveryCharge", 0);
      setValue("discountAmount", 0);
      setValue("courierDeduction", 0);
      setValue("amountReceived", 0, { shouldValidate: true });
      setValue("status", OrderStatus.PRE_ORDERED, { shouldValidate: true });
    } else {
      setAmountReceivedOverride({ orderId: amountReceivedOrderId, isManual: false });
      replace([emptyItem(false)]);
      previousOrderType.current = nextOrderType;
      if (!order) {
        setValue("status", OrderStatus.CONFIRMED, { shouldValidate: true });
      }
    }
  }

  function updateItemQuantity(index: number, nextQuantity: number, max?: number) {
    const sanitized = Math.max(1, Math.floor(nextQuantity || 1));
    const quantity = max ? Math.min(sanitized, max) : sanitized;
    setValue(`items.${index}.quantity`, quantity, { shouldValidate: true });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <SectionCard
        icon={ClipboardList}
        isOpen={sections.orderDetails}
        onToggle={() => toggleSection("orderDetails")}
        title="Order Details"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Order Type</Label>
            <Select
              disabled={order?.orderType === OrderType.PRE_ORDER}
              value={orderType}
              onValueChange={handleOrderTypeChange}
            >
              <SelectTrigger className="h-11 rounded-xl bg-white shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OrderType.NORMAL}>Normal Order</SelectItem>
                <SelectItem value={OrderType.PRE_ORDER}>Pre-order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", value as OrderStatus, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-white shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderStatus).map((orderStatus) => (
                  <SelectItem key={orderStatus} value={orderStatus}>
                    {formatEnum(orderStatus)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Order Date</Label>
            <Input className="h-11 rounded-xl bg-white shadow-none" type="date" {...register("orderDate")} />
          </div>

          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select
              value={source}
              onValueChange={(value) =>
                setValue("source", value as OrderSource, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-white shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderSource).map((source) => (
                  <SelectItem key={source} value={source}>
                    {formatEnum(source)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Payment</Label>
            <Select
              value={paymentStatus}
              onValueChange={(value) =>
                setValue("paymentStatus", value as PaymentStatus, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-white shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PaymentStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatEnum(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={UserRound}
        isOpen={sections.customer}
        onToggle={() => toggleSection("customer")}
        title="Customer"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Customer Name</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 rounded-xl bg-white pl-10 shadow-none"
                placeholder="Enter customer name"
                {...register("customerName")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 rounded-xl bg-white pl-10 shadow-none"
                placeholder="Enter phone number"
                {...register("customerPhone")}
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input
              className="h-11 rounded-xl bg-white shadow-none"
              placeholder="Delivery address"
              {...register("customerAddress")}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Package2}
        isOpen={sections.items}
        onToggle={() => toggleSection("items")}
        title="Items"
      >
        <div className="space-y-3">
          {fields.map((field, index) => {
          const item = watchedItems?.[index];
          const itemError = errors.items?.[index];
          const hasSelectedVariant = Number(item?.productVariantId || 0) > 0;
          const itemSource = (item?.source && item.source !== "CURRENT_STOCK"
            ? item.source
            : item?.purchaseItemId
              ? "INCOMING_PURCHASE"
              : isPreOrder && !hasSelectedVariant
                ? "INCOMING_PURCHASE"
                : "CURRENT_STOCK") as ItemSource;
          const useIncomingPurchase =
            isPreOrder && itemSource === "INCOMING_PURCHASE";
          const selectedPurchaseItem = preOrderPurchaseItems.find(
            (option) => option.id === Number(item?.purchaseItemId || 0),
          );
          const existingOrderItem = order?.items.find(
            (existingItem) =>
              existingItem.id === Number(item?.orderItemId || 0),
          );
          const isLockedPreOrderItem = Boolean(
            isPreOrder &&
              existingOrderItem &&
              isLockedPreOrderItemStatus(existingOrderItem.fulfillmentStatus),
          );
          const lockedStatusMessage = existingOrderItem
            ? lockedPreOrderItemMessage(existingOrderItem)
            : null;
          const existingReservedQuantity =
            existingOrderItem?.purchaseItemId === selectedPurchaseItem?.id
              ? (existingOrderItem?.quantity ?? 0)
              : 0;
          const availableForIncomingItem = selectedPurchaseItem
            ? selectedPurchaseItem.availableIncomingQuantity + existingReservedQuantity
            : 0;
          const selectedVariant = variantOptions.find(
            (option) => option.id === Number(item?.productVariantId || 0),
          );
          const currentStock = selectedVariant?.currentStock ?? 0;
          const itemQuantity = Number(item?.quantity || 0);
          const readiness =
            currentStock >= itemQuantity && itemQuantity > 0
              ? "READY"
              : currentStock > 0
                ? "PARTIAL"
                : "WAITING";
          const matchingIncomingBatches = selectedPurchaseItem
            ? preOrderPurchaseItems.filter(
                (option) => option.productVariantId === selectedPurchaseItem.productVariantId,
              )
            : [];
          const totalAvailableIncomingForVariant = matchingIncomingBatches.reduce(
            (sum, option) => sum + option.availableIncomingQuantity,
            0,
          );
          const itemMax =
            useIncomingPurchase && selectedPurchaseItem
              ? availableForIncomingItem
              : isPreOrder && itemSource === "CURRENT_STOCK"
                ? currentStock
                : undefined;

          return (
            <div
              key={field.id}
              className={cn(
                "rounded-2xl border bg-white p-3 shadow-sm",
                isLockedPreOrderItem && "bg-slate-50/80",
                itemError ? "border-rose-300" : "border-slate-200",
              )}
            >
              {isPreOrder ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Select
                    disabled={isLockedPreOrderItem}
                    value={itemSource}
                    onValueChange={(value) => handleItemSourceChange(index, value)}
                  >
                    <SelectTrigger className="h-8 w-full max-w-full rounded-full border-slate-200 bg-slate-50 px-3 text-xs sm:w-auto sm:min-w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOMING_PURCHASE">Incoming Purchase</SelectItem>
                      <SelectItem value="CURRENT_STOCK">Current Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-medium",
                      isLockedPreOrderItem
                        ? "bg-slate-100 text-slate-600"
                        : readiness === "READY"
                        ? "bg-emerald-50 text-emerald-700"
                        : readiness === "PARTIAL"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {isLockedPreOrderItem && lockedStatusMessage
                      ? lockedStatusMessage
                      : formatEnum(readiness)}
                  </span>
                </div>
              ) : null}

              {isLockedPreOrderItem && existingOrderItem ? (
                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-800">
                    {existingOrderItem.productName} - {existingOrderItem.variantName}
                  </span>{" "}
                  is {lockedStatusMessage?.toLowerCase()}. This item is already fulfilled and cannot be edited from this pre-order.
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_44px]">
                <div className="min-w-0 space-y-1.5 md:col-span-1">
                  <Label>{useIncomingPurchase ? "Incoming batch" : "Product"}</Label>
                  <OrderItemPicker
                    disabled={isLockedPreOrderItem}
                    useIncomingPurchase={useIncomingPurchase}
                    productVariantId={Number(item?.productVariantId || 0)}
                    purchaseItemId={
                      item?.purchaseItemId ? Number(item.purchaseItemId) : null
                    }
                    quantity={Number(item?.quantity || 0)}
                    unitSellingPrice={Number(item?.unitSellingPrice || 0)}
                    variantOptions={variantOptions}
                    preOrderPurchaseItems={preOrderPurchaseItems}
                    onSelectVariant={(value) => handleVariantSelect(index, value)}
                    onSelectPurchaseItem={(value) => handlePurchaseItemSelect(index, value)}
                  />
                </div>

                <div className="min-w-0 grid grid-cols-[minmax(0,1fr)_44px] gap-3 md:contents">
                  <div className="min-w-0 space-y-1.5">
                    <Label>Qty</Label>
                    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-none">
                      <button
                        className="flex h-full w-11 items-center justify-center border-r border-slate-200 text-slate-700"
                        disabled={isLockedPreOrderItem}
                        onClick={() => updateItemQuantity(index, Number(item?.quantity || 1) - 1, itemMax)}
                        type="button"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="flex min-w-0 flex-1 items-center justify-center text-sm font-semibold text-slate-950">
                        {Number(item?.quantity || 1)}
                      </div>
                      <button
                        className="flex h-full w-11 items-center justify-center border-l border-slate-200 text-slate-700"
                        disabled={isLockedPreOrderItem}
                        onClick={() => updateItemQuantity(index, Number(item?.quantity || 1) + 1, itemMax)}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      aria-label="Remove item"
                      className="h-11 w-11 rounded-xl border-rose-200 bg-rose-50 px-0 text-rose-600 hover:bg-rose-100"
                      disabled={fields.length === 1 || isLockedPreOrderItem}
                      onClick={() => remove(index)}
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="min-w-0 space-y-1.5 md:col-span-3">
                  <Label>Sell Price (BDT)</Label>
                  <Input
                    className="h-11 w-full min-w-0 rounded-xl bg-white shadow-none"
                    min={0}
                    step="0.01"
                    type="number"
                    {...register(`items.${index}.unitSellingPrice`, {
                      valueAsNumber: true,
                    })}
                    disabled={isLockedPreOrderItem}
                  />
                </div>
              </div>

              {useIncomingPurchase ? (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  {selectedPurchaseItem ? (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-4">
                        <span>Batch: {selectedPurchaseItem.purchaseRef}</span>
                        <span>Country: {selectedPurchaseItem.country ?? "-"}</span>
                        <span>Supplier: {selectedPurchaseItem.supplierName ?? "-"}</span>
                        <span>Available to this item: {availableForIncomingItem}</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-4">
                        <span>Status: {formatEnum(selectedPurchaseItem.purchaseStatus)}</span>
                        <span>Received: {selectedPurchaseItem.receivedQuantity}</span>
                        <span>Reserved: {selectedPurchaseItem.reservedPreOrderQuantity}</span>
                        <span>
                          Cost:{" "}
                          {formatCurrency(Number(selectedPurchaseItem.finalUnitLandedCostBdt))}
                        </span>
                      </div>
                      {matchingIncomingBatches.length > 1 ? (
                        <p>
                          This product is available across multiple incoming batches.
                          Total incoming available: {totalAvailableIncomingForVariant}.
                          Add another item row to reserve from another batch.
                        </p>
                      ) : null}
                      {Number(item?.quantity || 0) >
                      availableForIncomingItem ? (
                        <p className="font-medium text-rose-700">
                          {selectedPurchaseItem.productName} has only {availableForIncomingItem}
                          available from this batch.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    "Select a specific incoming purchase batch to see availability."
                  )}
                </div>
              ) : null}

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
                <div className="min-w-0 flex-1">
                  <span className="block text-slate-500">Unit cost</span>
                  <span className="block truncate font-medium text-slate-900">
                    {formatCurrency(Number(item?.unitCost || 0))}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-slate-500">Item total</span>
                  <span className="block truncate font-medium text-slate-900">
                    {formatCurrency(
                      Number(item?.quantity || 0) * Number(item?.unitSellingPrice || 0),
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-slate-500">Item profit</span>
                  <span
                    className={
                      Number(item?.quantity || 0) *
                        (Number(item?.unitSellingPrice || 0) - Number(item?.unitCost || 0)) <
                      0
                        ? "block truncate font-medium text-rose-600"
                        : "block truncate font-medium text-emerald-700"
                    }
                  >
                    {formatCurrency(
                      Number(item?.quantity || 0) *
                        (Number(item?.unitSellingPrice || 0) - Number(item?.unitCost || 0)),
                    )}
                  </span>
                </div>
              </div>
              {itemError ? (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {itemError.purchaseItemId?.message ??
                    itemError.productVariantId?.message ??
                    itemError.quantity?.message ??
                    `Please check item ${index + 1}.`}
                </p>
              ) : null}
            </div>
          );
        })}
        {errors.items ? (
          <p className="text-xs text-rose-600">Please select valid item details.</p>
        ) : null}
          <Button
            className="h-11 w-full rounded-2xl border-dashed border-emerald-200 bg-emerald-50/50 text-sm font-medium text-emerald-800 shadow-none hover:bg-emerald-50"
            onClick={() => append(emptyItem(isPreOrder))}
            type="button"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={WalletCards}
        isOpen={sections.charges}
        onToggle={() => toggleSection("charges")}
        title="Charges & Payment"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {!isPreOrder ? (
            <>
              <div className="space-y-1.5">
                <Label>Discount (BDT)</Label>
                <div className="relative">
                  <WalletCards className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-xl bg-white pl-10 shadow-none"
                    min={0}
                    step="0.01"
                    type="number"
                    {...register("discountAmount", { valueAsNumber: true })}
                  />
                </div>
                {errors.discountAmount ? (
                  <p className="text-xs text-rose-600">{errors.discountAmount.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Charge (BDT)</Label>
                <div className="relative">
                  <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-xl bg-white pl-10 shadow-none"
                    min={0}
                    step="0.01"
                    type="number"
                    {...register("deliveryCharge", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>COD/Courier Fee (BDT)</Label>
                <div className="relative">
                  <Package2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-xl bg-white pl-10 shadow-none"
                    min={0}
                    step="0.01"
                    type="number"
                    {...register("courierDeduction", { valueAsNumber: true })}
                  />
                </div>
                {errors.courierDeduction ? (
                  <p className="text-xs text-rose-600">{errors.courierDeduction.message}</p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label>{isPreOrder ? "Amount Received (BDT)" : "Amount Received (BDT)"}</Label>
            <div className="relative">
              <WalletCards className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 rounded-xl bg-white pl-10 shadow-none"
                min={0}
                step="0.01"
                type="number"
                {...register("amountReceived", {
                  valueAsNumber: true,
                  onChange: handleAmountReceivedChange,
                })}
              />
            </div>
            <p className="text-xs text-slate-500">
              {isPreOrder
                ? "Advance or payment received so far."
                : isAmountReceivedManual
                  ? "Actual received override."
                  : "Auto: customer payable plus delivery charge minus COD/courier fee."}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={BarChart3}
        isOpen={sections.summary}
        onToggle={() => toggleSection("summary")}
        title="Summary"
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="space-y-2">
            <SummaryRow label="Product Subtotal" value={formatCurrency(totals.subtotal)} />
            {!isPreOrder ? (
              <>
                <SummaryRow label="Customer Payable" value={formatCurrency(totals.customerPayable)} emphasized positive />
                <SummaryRow label="Delivery Charge" value={formatCurrency(totals.deliveryCharge)} />
                <SummaryRow label="COD/Courier Fee" value={formatCurrency(totals.courierDeduction)} />
              </>
            ) : (
              <>
                <SummaryRow label="Customer Payable" value={formatCurrency(totals.customerPayable)} emphasized positive />
                <SummaryRow label="Advance Received" value={formatCurrency(totals.received)} />
                <SummaryRow label="Due Amount" value={formatCurrency(totals.dueAmount)} />
              </>
            )}
            <div className="my-3 border-t border-slate-200" />
            <SummaryRow label="Product Cost" value={formatCurrency(totals.productCost)} />
            <SummaryRow
              label={isPreOrder ? "Expected Profit" : "Gross Profit"}
              value={formatCurrency(totals.grossProfit)}
            />
            <div className="my-3 border-t border-slate-200" />
            <SummaryRow
              label={isPreOrder ? "Expected Profit" : "Net Profit"}
              value={formatCurrency(totals.netProfit)}
              emphasized
              positive={totals.netProfit >= 0}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={NotebookPen}
        isOpen={sections.notes}
        onToggle={() => toggleSection("notes")}
        title="Notes"
      >
        <div className="space-y-1.5">
          <Textarea
            className="min-h-24 rounded-xl bg-white shadow-none"
            placeholder="Optional internal notes"
            {...register("notes")}
          />
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-10 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Customer Payable</p>
            <p className="text-2xl font-semibold tracking-tight text-emerald-700">
              {formatCurrency(totals.customerPayable)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="h-11 rounded-xl px-5"
              disabled={isSubmitting}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="h-11 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? (order ? "Updating order…" : "Creating order…") : order ? "Update Order" : "Create Order"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
