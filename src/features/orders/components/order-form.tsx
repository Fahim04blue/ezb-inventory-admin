"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Minus, Plus } from "lucide-react";
import { OrderSource, OrderStatus, OrderType, PaymentStatus } from "@prisma/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  initialPurchaseItemId?: number | null;
  onSubmit: (input: CreateOrderInput) => Promise<void>;
  onCancel: () => void;
};

const today = new Date().toISOString().slice(0, 10);
type ItemSource = "INCOMING_PURCHASE" | "CURRENT_STOCK";

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
): OrderFormValues {
  if (!order) {
    return {
      orderType: initialPurchaseItem ? OrderType.PRE_ORDER : OrderType.NORMAL,
      status: initialPurchaseItem ? OrderStatus.PRE_ORDERED : OrderStatus.CONFIRMED,
      orderDate: today,
      source: OrderSource.FACEBOOK,
      paymentStatus: PaymentStatus.UNPAID,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      paidAmount: undefined,
      amountReceived: initialPurchaseItem ? 0 : undefined,
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
          : emptyItem(false),
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

type OrderItemPickerProps = {
  useIncomingPurchase: boolean;
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
  const stockOptions = variantOptions;
  const selectedLabel = useIncomingPurchase
    ? selectedIncoming
      ? purchaseItemLabel(selectedIncoming)
      : ""
    : selectedVariant
      ? optionLabel(selectedVariant)
      : "";

  function searchText(value: string) {
    if (value.startsWith("incoming:")) {
      const id = Number(value.replace("incoming:", ""));
      const option = selectablePurchaseItems.find((item) => item.id === id);
      return option
        ? [
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
        : "";
    }

    const id = Number(value.replace("stock:", ""));
    const option = variantOptions.find((item) => item.id === id);
    return option
      ? [
          option.productName,
          option.variantName,
          option.sku,
          "current stock",
          "stock",
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between gap-2 rounded-xl bg-white px-3 font-normal"
        >
          {selectedLabel ? (
            <span className="min-w-0 truncate text-left">{selectedLabel}</span>
          ) : (
            <span className="min-w-0 truncate text-left text-muted-foreground">
              {useIncomingPurchase ? "Search incoming purchase batch" : "Search product"}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-[22rem] max-w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-xl"
      >
        <Command
          className="bg-white text-slate-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-input-wrapper]]:border-slate-200 [&_[cmdk-input-wrapper]]:bg-slate-50/70"
          filter={(value, search) => {
            const haystack = searchText(value).toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder={
              useIncomingPurchase
                ? "Search product, SKU, supplier, country, purchase..."
                : "Search product, SKU..."
            }
          />
          <CommandList className="max-h-[360px] bg-white">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              No item found.
            </CommandEmpty>
            {useIncomingPurchase ? (
              <CommandGroup heading="Incoming purchase items" className="bg-white p-1">
                {selectablePurchaseItems.map((option) => (
                  <CommandItem
                    key={`incoming-${option.id}`}
                    value={`incoming:${option.id}`}
                    onSelect={() => {
                      onSelectPurchaseItem(String(option.id));
                      setOpen(false);
                    }}
                    className="flex cursor-pointer flex-col items-start gap-1 rounded-lg border border-transparent p-3 data-[selected=true]:border-amber-200 data-[selected=true]:bg-amber-50"
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-950">
                          {option.productName} - {option.variantName}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-800">
                            Incoming
                          </span>
                          {option.country ? <span>{option.country}</span> : null}
                          <span>{option.purchaseRef}</span>
                          <span>{formatEnum(option.purchaseStatus)}</span>
                          {option.supplierName ? <span>{option.supplierName}</span> : null}
                          {option.sku ? <span>SKU: {option.sku}</span> : null}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 text-emerald-700",
                          selectedIncoming?.id === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
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
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandGroup heading="Products" className="bg-white p-1">
                {stockOptions.map((option) => (
                  <CommandItem
                    key={`stock-${option.id}`}
                    value={`stock:${option.id}`}
                    onSelect={() => {
                      onSelectVariant(String(option.id));
                      setOpen(false);
                    }}
                    className="flex cursor-pointer flex-col items-start gap-1 rounded-lg border border-transparent p-3 data-[selected=true]:border-slate-200 data-[selected=true]:bg-slate-50"
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-950">
                          {option.productName} - {option.variantName}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                          {option.sku ? <span>SKU: {option.sku}</span> : null}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 text-emerald-700",
                          selectedVariant?.id === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>Stock: {option.currentStock}</span>
                      <span>Cost: {formatCurrency(Number(option.currentLandedCost || 0))}</span>
                      {option.defaultSellingPrice ? (
                        <span>Sell: {formatCurrency(Number(option.defaultSellingPrice))}</span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OrderForm({
  variantOptions,
  preOrderPurchaseItems,
  isSubmitting,
  order,
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
    defaultValues: getDefaultValues(order, initialPurchaseItem),
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
  const initialAmountReceivedManual = useMemo(
    () => hasManualAmountReceived(order),
    [order],
  );
  const isAmountReceivedManual =
    amountReceivedOverride?.orderId === amountReceivedOrderId
      ? amountReceivedOverride.isManual
      : initialAmountReceivedManual;

  useEffect(() => {
    const values = getDefaultValues(order, initialPurchaseItem);
    reset(values);
    previousOrderType.current = values.orderType as OrderType;
  }, [initialPurchaseItem, order, reset]);

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
      setValue("deliveryCharge", 0);
      setValue("discountAmount", 0);
      setValue("courierDeduction", 0);
      setValue("amountReceived", 0, { shouldValidate: true });
    } else {
      setAmountReceivedOverride({ orderId: amountReceivedOrderId, isManual: false });
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Order type</Label>
          <Select
            disabled={order?.orderType === OrderType.PRE_ORDER}
            value={orderType}
            onValueChange={handleOrderTypeChange}
          >
            <SelectTrigger className="h-10 rounded-xl">
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
            <SelectTrigger className="h-10 rounded-xl">
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
          <Label>Order date</Label>
          <Input className="h-10 rounded-xl" type="date" {...register("orderDate")} />
        </div>

        <div className="space-y-1.5">
          <Label>Source</Label>
          <Select
            value={source}
            onValueChange={(value) =>
              setValue("source", value as OrderSource, { shouldValidate: true })
            }
          >
            <SelectTrigger className="h-10 rounded-xl">
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
            <SelectTrigger className="h-10 rounded-xl">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Customer name</Label>
          <Input
            className="h-10 rounded-xl"
            placeholder="Customer name"
            {...register("customerName")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            className="h-10 rounded-xl"
            placeholder="Phone number"
            {...register("customerPhone")}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Address</Label>
          <Input
            className="h-10 rounded-xl"
            placeholder="Delivery address"
            {...register("customerAddress")}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Items</h3>
            <p className="text-xs text-slate-500">
              {isPreOrder
                ? "Reserve from specific incoming purchase batches."
                : "Sell from current stock."}
            </p>
          </div>
          <Button
            className="h-9 w-auto rounded-xl px-3"
            onClick={() => append(emptyItem(isPreOrder))}
            type="button"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Item
          </Button>
        </div>

        {fields.map((field, index) => {
          const item = watchedItems?.[index];
          const itemError = errors.items?.[index];
          const itemSource = (item?.source ??
            (item?.purchaseItemId
              ? "INCOMING_PURCHASE"
              : "CURRENT_STOCK")) as ItemSource;
          const useIncomingPurchase =
            isPreOrder && itemSource === "INCOMING_PURCHASE";
          const selectedPurchaseItem = preOrderPurchaseItems.find(
            (option) => option.id === Number(item?.purchaseItemId || 0),
          );
          const existingOrderItem = order?.items.find(
            (existingItem) =>
              existingItem.id === Number(item?.orderItemId || 0),
          );
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

          return (
            <div
              key={field.id}
              className={cn(
                "rounded-xl border bg-white p-3",
                itemError ? "border-rose-300" : "border-slate-200",
              )}
            >
              {isPreOrder ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Select
                    value={itemSource}
                    onValueChange={(value) => handleItemSourceChange(index, value)}
                  >
                    <SelectTrigger className="h-8 w-auto min-w-40 rounded-full border-slate-200 bg-slate-50 px-3 text-xs">
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
                      readiness === "READY"
                        ? "bg-emerald-50 text-emerald-700"
                        : readiness === "PARTIAL"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {formatEnum(readiness)}
                  </span>
                </div>
              ) : null}
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_84px_110px_36px]">
                <div className="space-y-1.5">
                  <Label>{useIncomingPurchase ? "Incoming batch" : "Product"}</Label>
                  <OrderItemPicker
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

                <div className="space-y-1.5">
                  <Label>Qty</Label>
                  <Input
                    className="h-10 rounded-xl"
                    max={
                      useIncomingPurchase && selectedPurchaseItem
                        ? availableForIncomingItem
                        : isPreOrder && itemSource === "CURRENT_STOCK"
                          ? currentStock
                          : undefined
                    }
                    min={1}
                    type="number"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Sell price</Label>
                  <Input
                    className="h-10 rounded-xl"
                    min={0}
                    step="0.01"
                    type="number"
                    {...register(`items.${index}.unitSellingPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    aria-label="Remove item"
                    className="h-10 w-10 rounded-xl px-0"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    type="button"
                    variant="outline"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
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
              <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="block text-slate-500">Unit cost</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(Number(item?.unitCost || 0))}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500">Item total</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(
                      Number(item?.quantity || 0) * Number(item?.unitSellingPrice || 0),
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500">Item profit</span>
                  <span
                    className={
                      Number(item?.quantity || 0) *
                        (Number(item?.unitSellingPrice || 0) - Number(item?.unitCost || 0)) <
                      0
                        ? "font-medium text-rose-600"
                        : "font-medium text-emerald-700"
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {!isPreOrder ? (
          <>
            <div className="space-y-1.5">
              <Label>Discount</Label>
              <Input
                className="h-10 rounded-xl"
                min={0}
                step="0.01"
                type="number"
                {...register("discountAmount", { valueAsNumber: true })}
              />
              {errors.discountAmount ? (
                <p className="text-xs text-rose-600">{errors.discountAmount.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Delivery Charge</Label>
              <Input
                className="h-10 rounded-xl"
                min={0}
                step="0.01"
                type="number"
                {...register("deliveryCharge", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>COD/Courier Fee</Label>
              <p className="text-xs text-slate-500">
                Deducted by courier company before settlement.
              </p>
              <Input
                className="h-10 rounded-xl"
                min={0}
                step="0.01"
                type="number"
                {...register("courierDeduction", { valueAsNumber: true })}
              />
              {errors.courierDeduction ? (
                <p className="text-xs text-rose-600">{errors.courierDeduction.message}</p>
              ) : null}
            </div>
          </>
        ) : null}
        <div className="space-y-1.5">
          <Label>{isPreOrder ? "Advance Received" : "Amount Received"}</Label>
          <p className="text-xs text-slate-500">
            {isPreOrder
              ? "Advance or payment received so far."
              : isAmountReceivedManual
                ? "Actual received override."
                : "Auto: customer payable plus delivery charge minus COD/courier fee."}
          </p>
          <Input
            className="h-10 rounded-xl"
            min={0}
            step="0.01"
            type="number"
            {...register("amountReceived", {
              valueAsNumber: true,
              onChange: handleAmountReceivedChange,
            })}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
        <div className="flex justify-between gap-3 text-slate-600">
          <span>Product Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        {!isPreOrder ? (
          <>
            <div className="mt-2 flex justify-between gap-3 text-slate-600">
              <span>Discount</span>
              <span>{formatCurrency(totals.discountAmount)}</span>
            </div>
          </>
        ) : null}
        <div className="mt-2 flex justify-between gap-3 font-semibold text-slate-950">
          <span>Customer Payable</span>
          <span>{formatCurrency(totals.customerPayable)}</span>
        </div>
        {!isPreOrder ? (
          <>
            <div className="mt-2 flex justify-between gap-3 text-slate-600">
              <span>Delivery Charge</span>
              <span>{formatCurrency(totals.deliveryCharge)}</span>
            </div>
            <div className="mt-2 flex justify-between gap-3 text-slate-600">
              <span>COD/Courier Fee</span>
              <span>{formatCurrency(totals.courierDeduction)}</span>
            </div>
          </>
        ) : null}
        <div className="mt-2 flex justify-between gap-3 text-slate-600">
          <span>{isPreOrder ? "Advance Received" : "Amount Received"}</span>
          <span>{formatCurrency(totals.received)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3 text-slate-600">
          <span>Product Cost</span>
          <span>{formatCurrency(totals.productCost)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3 text-slate-600">
          <span>{isPreOrder ? "Expected Profit" : "Gross Profit"}</span>
          <span>{formatCurrency(totals.grossProfit)}</span>
        </div>
        {isPreOrder ? (
          <div className="mt-2 flex justify-between gap-3 text-slate-600">
            <span>Due Amount</span>
            <span>{formatCurrency(totals.dueAmount)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex justify-between gap-3 border-t border-slate-200 pt-2 font-semibold">
          <span>{isPreOrder ? "Expected Profit" : "Net Profit"}</span>
          <span className={totals.netProfit < 0 ? "text-rose-600" : "text-emerald-700"}>
            {formatCurrency(totals.netProfit)}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          className="min-h-20 rounded-xl"
          placeholder="Optional internal notes"
          {...register("notes")}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <Button
          className="w-auto rounded-xl px-4"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="w-auto rounded-xl bg-emerald-800 px-4 text-white hover:bg-emerald-900"
          disabled={isSubmitting}
          type="submit"
        >
          {order ? "Update Order" : "Create Order"}
        </Button>
      </div>
    </form>
  );
}
