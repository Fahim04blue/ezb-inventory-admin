ALTER TABLE "product_variants"
ADD COLUMN IF NOT EXISTS "isPriority" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "priorityNote" TEXT,
ADD COLUMN IF NOT EXISTS "priorityRank" INTEGER;

CREATE INDEX IF NOT EXISTS "product_variants_isPriority_idx" ON "product_variants"("isPriority");
CREATE INDEX IF NOT EXISTS "product_variants_priorityRank_idx" ON "product_variants"("priorityRank");
