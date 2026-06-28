ALTER TYPE "OrderItemFulfillmentStatus" ADD VALUE IF NOT EXISTS 'IN_DELIVERY';

CREATE TYPE "OrderDeliveryStatus" AS ENUM (
  'READY_TO_DELIVER',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
);

CREATE TABLE "order_deliveries" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "deliveryNumber" TEXT NOT NULL,
  "status" "OrderDeliveryStatus" NOT NULL DEFAULT 'READY_TO_DELIVER',
  "customerName" TEXT,
  "customerPhone" TEXT,
  "customerAddress" TEXT,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "deliveryCharge" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "courierDeduction" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "amountReceived" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "customerPayable" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "productCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "netProfit" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "deliveredAt" TIMESTAMP(3),
  "createdById" INTEGER,
  "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_delivery_items" (
  "id" SERIAL NOT NULL,
  "deliveryId" INTEGER NOT NULL,
  "orderItemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitSellingPrice" DECIMAL(14,4) NOT NULL,
  "unitCost" DECIMAL(14,4) NOT NULL,
  "totalSellingPrice" DECIMAL(14,4) NOT NULL,
  "totalCost" DECIMAL(14,4) NOT NULL,
  "profit" DECIMAL(14,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_delivery_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_deliveries_deliveryNumber_key" ON "order_deliveries"("deliveryNumber");
CREATE INDEX "order_deliveries_orderId_idx" ON "order_deliveries"("orderId");
CREATE INDEX "order_deliveries_status_idx" ON "order_deliveries"("status");
CREATE INDEX "order_deliveries_createdAt_idx" ON "order_deliveries"("createdAt");
CREATE INDEX "order_delivery_items_deliveryId_idx" ON "order_delivery_items"("deliveryId");
CREATE INDEX "order_delivery_items_orderItemId_idx" ON "order_delivery_items"("orderItemId");

ALTER TABLE "order_deliveries" ADD CONSTRAINT "order_deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_deliveries" ADD CONSTRAINT "order_deliveries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_deliveries" ADD CONSTRAINT "order_deliveries_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "order_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
