ALTER TYPE "OrderSource" ADD VALUE IF NOT EXISTS 'SHEIN';

DO $$
BEGIN
  CREATE TYPE "SheinBatchStatus" AS ENUM ('DRAFT', 'ORDERED', 'IN_CARGO', 'PARTIALLY_ARRIVED', 'ARRIVED', 'CLOSED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "SheinBatchItemStatus" AS ENUM ('CONFIRMED', 'ORDERED', 'IN_CARGO', 'ARRIVED', 'MOVED_TO_ORDER', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "order_items"
ALTER COLUMN "productVariantId" DROP NOT NULL,
ADD COLUMN "sheinBatchItemId" TEXT;

CREATE TABLE "shein_batches" (
  "id" TEXT NOT NULL,
  "batchName" TEXT NOT NULL,
  "sourceCountry" TEXT NOT NULL DEFAULT 'Malaysia',
  "currency" TEXT NOT NULL DEFAULT 'MYR',
  "customerRmRate" DECIMAL(14,4) NOT NULL DEFAULT 33,
  "bankRate" DECIMAL(14,4),
  "customerWeightRatePerGram" DECIMAL(14,4) NOT NULL DEFAULT 1.25,
  "actualCargoRatePerGram" DECIMAL(14,4) NOT NULL DEFAULT 0.98,
  "orderDate" TIMESTAMP(3),
  "sheinOrderNumbers" TEXT,
  "status" "SheinBatchStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shein_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shein_batch_items" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT,
  "productName" TEXT NOT NULL,
  "sheinLink" TEXT,
  "imageUrl" TEXT,
  "screenshotUrl" TEXT,
  "size" TEXT,
  "color" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "customerQuotedPriceBdt" DECIMAL(14,4) NOT NULL,
  "advanceReceivedBdt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "actualSheinPriceRm" DECIMAL(14,4),
  "bankRateSnapshot" DECIMAL(14,4),
  "actualItemCostBdt" DECIMAL(14,4),
  "actualWeightGram" INTEGER,
  "customerWeightRateSnapshot" DECIMAL(14,4) NOT NULL DEFAULT 1.25,
  "customerWeightChargeBdt" DECIMAL(14,4),
  "actualCargoRateSnapshot" DECIMAL(14,4) NOT NULL DEFAULT 0.98,
  "actualCargoCostBdt" DECIMAL(14,4),
  "totalCustomerPayableBdt" DECIMAL(14,4),
  "totalActualCostBdt" DECIMAL(14,4),
  "profitBdt" DECIMAL(14,4),
  "remainingDueBdt" DECIMAL(14,4),
  "status" "SheinBatchItemStatus" NOT NULL DEFAULT 'CONFIRMED',
  "movedToOrderId" INTEGER,
  "movedToOrderItemId" INTEGER,
  "movedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shein_batch_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shein_batch_items_movedToOrderItemId_key" ON "shein_batch_items"("movedToOrderItemId");
CREATE INDEX "order_items_sheinBatchItemId_idx" ON "order_items"("sheinBatchItemId");
CREATE INDEX "shein_batches_status_idx" ON "shein_batches"("status");
CREATE INDEX "shein_batches_orderDate_idx" ON "shein_batches"("orderDate");
CREATE INDEX "shein_batch_items_batchId_idx" ON "shein_batch_items"("batchId");
CREATE INDEX "shein_batch_items_phone_idx" ON "shein_batch_items"("phone");
CREATE INDEX "shein_batch_items_customerName_idx" ON "shein_batch_items"("customerName");
CREATE INDEX "shein_batch_items_status_idx" ON "shein_batch_items"("status");
CREATE INDEX "shein_batch_items_movedToOrderId_idx" ON "shein_batch_items"("movedToOrderId");

ALTER TABLE "shein_batch_items" ADD CONSTRAINT "shein_batch_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "shein_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shein_batch_items" ADD CONSTRAINT "shein_batch_items_movedToOrderId_fkey" FOREIGN KEY ("movedToOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shein_batch_items" ADD CONSTRAINT "shein_batch_items_movedToOrderItemId_fkey" FOREIGN KEY ("movedToOrderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sheinBatchItemId_fkey" FOREIGN KEY ("sheinBatchItemId") REFERENCES "shein_batch_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
