ALTER TABLE "shein_batch_items" ADD COLUMN "customerSource" TEXT;

CREATE INDEX "shein_batch_items_customerSource_idx" ON "shein_batch_items"("customerSource");
