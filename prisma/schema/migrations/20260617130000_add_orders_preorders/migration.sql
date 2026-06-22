CREATE TYPE "OrderType" AS ENUM ('NORMAL', 'PRE_ORDER');

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PRE_ORDERED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_TO_DELIVER';

ALTER TABLE "orders"
ADD COLUMN "orderType" "OrderType" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "customerAddress" TEXT,
ADD COLUMN "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN "deliveryCharge" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN "paidAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN "dueAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN "productCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "orders"
SET
  "orderDate" = COALESCE("orderedAt", "createdAt"),
  "discountAmount" = "discount",
  "deliveryCharge" = "deliveryChargeCollected",
  "productCost" = "totalProductCost",
  "paidAmount" = CASE
    WHEN "paymentStatus" = 'PAID' THEN "totalAmount"
    ELSE 0
  END,
  "dueAmount" = CASE
    WHEN "paymentStatus" = 'PAID' THEN 0
    ELSE "totalAmount"
  END;

ALTER TABLE "order_items"
ADD COLUMN "purchaseItemId" INTEGER;

ALTER TABLE "purchase_items"
ADD COLUMN "reservedPreOrderQuantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_purchaseItemId_fkey"
FOREIGN KEY ("purchaseItemId") REFERENCES "purchase_items"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "orders_orderType_idx" ON "orders"("orderType");
CREATE INDEX "orders_orderDate_idx" ON "orders"("orderDate");
CREATE INDEX "orders_isActive_idx" ON "orders"("isActive");
CREATE INDEX "order_items_purchaseItemId_idx" ON "order_items"("purchaseItemId");
