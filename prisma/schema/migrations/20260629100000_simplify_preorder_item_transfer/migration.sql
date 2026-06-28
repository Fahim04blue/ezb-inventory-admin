ALTER TYPE "OrderItemFulfillmentStatus" ADD VALUE IF NOT EXISTS 'MOVED_TO_ORDER';

ALTER TABLE "orders"
ADD COLUMN "sourcePreOrderId" INTEGER;

ALTER TABLE "order_items"
ADD COLUMN "transferredToOrderId" INTEGER,
ADD COLUMN "transferredAt" TIMESTAMP(3);

CREATE INDEX "orders_sourcePreOrderId_idx" ON "orders"("sourcePreOrderId");
CREATE INDEX "order_items_transferredToOrderId_idx" ON "order_items"("transferredToOrderId");

ALTER TABLE "orders" ADD CONSTRAINT "orders_sourcePreOrderId_fkey" FOREIGN KEY ("sourcePreOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_transferredToOrderId_fkey" FOREIGN KEY ("transferredToOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
