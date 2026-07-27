import Link from "next/link";

import { SheinProductImportTest } from "@/features/shein/components/shein-product-import-test";

export default function SheinApifyTestPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">SHEIN Apify Test</h1>
        <p className="mt-1 text-sm text-muted-foreground">Check what Apify returns for a real SHEIN product URL.</p>
      </div>
      <div className="flex flex-wrap rounded-2xl border bg-card p-3 shadow-sm">
        <Link className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-muted" href="/shein/batches">Batches</Link>
        <Link className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-muted" href="/shein/customer-orders">Customer Orders</Link>
        <Link className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium !text-white shadow-sm hover:!text-white" href="/shein/apify-test">Apify Test</Link>
      </div>
      <SheinProductImportTest />
    </div>
  );
}
