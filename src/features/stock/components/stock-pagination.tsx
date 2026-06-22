import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StockPaginationProps {
  currentPage: number;
  rowsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: number) => void;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, start + 3);
  const adjustedStart = Math.max(1, end - 3);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}

export function StockPagination({
  currentPage,
  rowsPerPage,
  totalItems,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}: StockPaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = totalItems === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalItems);
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="shrink-0 text-sm text-slate-700">
        Showing {start}-{end} of {totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-9 w-9 rounded-lg border-slate-200 bg-white px-0 shadow-none"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition-colors",
                page === currentPage
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              {page}
            </button>
          ))}

          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-9 w-9 rounded-lg border-slate-200 bg-white px-0 shadow-none"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>

        <Select
          value={String(rowsPerPage)}
          onValueChange={(value) => onRowsPerPageChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-[124px] rounded-lg border-slate-200 bg-white px-3 text-sm shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
