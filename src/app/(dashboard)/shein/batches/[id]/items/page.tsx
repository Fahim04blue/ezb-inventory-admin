import { SheinBatchItemsPageClient } from "@/features/shein/components/shein-batch-items-page-client";

type Params = { params: Promise<{ id: string }> };

export default async function SheinBatchItemsPage({ params }: Params) {
  return <SheinBatchItemsPageClient batchId={(await params).id} />;
}
