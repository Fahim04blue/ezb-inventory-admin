"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrdersPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: number) => void;
};

export function OrdersPagination({
  currentPage,
  totalPages,
  totalItems,
  rowsPerPage,
  startItem,
  endItem,
  onPageChange,
  onRowsPerPageChange,
}: OrdersPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
      <p>
        Showing {totalItems ? startItem : 0}-{endItem} of {totalItems}
      </p>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous page"
            className="h-9 w-9 rounded-xl px-0"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages.map((page) => (
            <Button
              key={page}
              className={
                page === currentPage
                  ? "h-9 w-9 rounded-xl bg-emerald-800 px-0 text-white hover:bg-emerald-900"
                  : "h-9 w-9 rounded-xl px-0"
              }
              onClick={() => onPageChange(page)}
              variant={page === currentPage ? "default" : "outline"}
            >
              {page}
            </Button>
          ))}
          <Button
            aria-label="Next page"
            className="h-9 w-9 rounded-xl px-0"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select
          value={String(rowsPerPage)}
          onValueChange={(value) => onRowsPerPageChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-[122px] rounded-xl border-slate-200 bg-white text-sm shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
