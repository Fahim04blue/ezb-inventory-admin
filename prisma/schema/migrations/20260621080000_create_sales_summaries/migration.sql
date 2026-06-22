ALTER TYPE "OrderSource" ADD VALUE IF NOT EXISTS 'MIXED';

CREATE TABLE "sales_summaries" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "source" "OrderSource",
    "amountBdt" DECIMAL(14,4) NOT NULL,
    "deliveryChargeCollectedBdt" DECIMAL(14,4),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_summaries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sales_summaries_date_idx" ON "sales_summaries"("date");
CREATE INDEX "sales_summaries_source_idx" ON "sales_summaries"("source");
CREATE INDEX "sales_summaries_isActive_idx" ON "sales_summaries"("isActive");

ALTER TABLE "sales_summaries"
ADD CONSTRAINT "sales_summaries_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_summaries"
ADD CONSTRAINT "sales_summaries_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;