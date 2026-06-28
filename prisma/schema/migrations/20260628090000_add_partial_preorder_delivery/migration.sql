CREATE TYPE "OrderItemFulfillmentStatus" AS ENUM (
  'WAITING',
  'READY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
);

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_DELIVERED';

ALTER TABLE "order_items"
ADD COLUMN "fulfillmentStatus" "OrderItemFulfillmentStatus" NOT NULL DEFAULT 'WAITING',
ADD COLUMN "deliveredQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "deliveredAt" TIMESTAMP(3);

UPDATE "order_items" AS oi
SET
  "fulfillmentStatus" = CASE
    WHEN o."status" = 'DELIVERED' THEN 'DELIVERED'::"OrderItemFulfillmentStatus"
    WHEN o."status" = 'CANCELLED' THEN 'CANCELLED'::"OrderItemFulfillmentStatus"
    WHEN o."status" = 'RETURNED' THEN 'RETURNED'::"OrderItemFulfillmentStatus"
    WHEN EXISTS (
      SELECT 1
      FROM "stock_movements" sm
      WHERE sm."orderItemId" = oi."id"
        AND sm."type" = 'SALE'
        AND sm."direction" = 'OUT'
    ) THEN 'DELIVERED'::"OrderItemFulfillmentStatus"
    WHEN o."status" = 'READY_TO_DELIVER' THEN 'READY'::"OrderItemFulfillmentStatus"
    ELSE 'WAITING'::"OrderItemFulfillmentStatus"
  END,
  "deliveredQuantity" = CASE
    WHEN o."status" = 'DELIVERED'
      OR EXISTS (
        SELECT 1
        FROM "stock_movements" sm
        WHERE sm."orderItemId" = oi."id"
          AND sm."type" = 'SALE'
          AND sm."direction" = 'OUT'
      )
    THEN oi."quantity"
    ELSE 0
  END,
  "deliveredAt" = CASE
    WHEN o."status" = 'DELIVERED' THEN o."deliveredAt"
    WHEN EXISTS (
      SELECT 1
      FROM "stock_movements" sm
      WHERE sm."orderItemId" = oi."id"
        AND sm."type" = 'SALE'
        AND sm."direction" = 'OUT'
    ) THEN COALESCE(
      (
        SELECT MIN(sm."createdAt")
        FROM "stock_movements" sm
        WHERE sm."orderItemId" = oi."id"
          AND sm."type" = 'SALE'
          AND sm."direction" = 'OUT'
      ),
      o."deliveredAt"
    )
    ELSE NULL
  END
FROM "orders" AS o
WHERE oi."orderId" = o."id";

CREATE INDEX "order_items_fulfillmentStatus_idx" ON "order_items"("fulfillmentStatus");
