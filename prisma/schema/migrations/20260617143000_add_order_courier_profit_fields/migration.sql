ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "customerPayable" DECIMAL(14, 4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "courierDeduction" DECIMAL(14, 4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "amountReceived" DECIMAL(14, 4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "netProfit" DECIMAL(14, 4) NOT NULL DEFAULT 0;

UPDATE "orders"
SET
  "customerPayable" = COALESCE("totalAmount", 0),
  "courierDeduction" = COALESCE("courierCost", 0),
  "amountReceived" = COALESCE(NULLIF("paidAmount", 0), COALESCE("totalAmount", 0) - COALESCE("courierCost", 0)),
  "netProfit" = COALESCE(NULLIF("netOrderProfit", 0), COALESCE(NULLIF("paidAmount", 0), COALESCE("totalAmount", 0) - COALESCE("courierCost", 0)) - COALESCE("productCost", "totalProductCost", 0))
WHERE
  "customerPayable" = 0
  AND "courierDeduction" = 0
  AND "amountReceived" = 0
  AND "netProfit" = 0;
