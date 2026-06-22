ALTER TABLE "sales_summaries"
ADD COLUMN IF NOT EXISTS "estimatedProductCost" DECIMAL(14, 4);
