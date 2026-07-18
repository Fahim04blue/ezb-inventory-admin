export function ReportsPageHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track sales, expenses, profit, stock value, and business performance.
        </p>
      </div>
    </div>
  );
}
