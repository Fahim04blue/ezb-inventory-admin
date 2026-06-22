import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type DateFilter = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH";
export type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface FinanceFilters<TEnum extends string> {
  search: string;
  category: TEnum | "ALL";
  date: DateFilter;
  status: StatusFilter;
}

interface FinanceFilterBarProps<TEnum extends string> {
  filters: FinanceFilters<TEnum>;
  onFilterChange: <K extends keyof FinanceFilters<TEnum>>(
    key: K,
    value: FinanceFilters<TEnum>[K]
  ) => void;
  onClearFilters: () => void;
  categoryOptions: { value: string; label: string }[];
  categoryPlaceholder?: string;
}

export function FinanceFilterBar<TEnum extends string>({
  filters,
  onFilterChange,
  onClearFilters,
  categoryOptions,
  categoryPlaceholder = "All Categories",
}: FinanceFilterBarProps<TEnum>) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "ALL" ||
    filters.date !== "ALL" ||
    filters.status !== "ALL";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] md:min-w-[250px] md:flex-none">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search title or notes..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="pl-9 h-9 rounded-full text-sm border-border/60 bg-background focus-visible:ring-1 focus-visible:border-border"
        />
      </div>

      <Select
        value={filters.category}
        onValueChange={(val) => onFilterChange("category", val as any)}
      >
        <SelectTrigger className="w-auto min-w-[160px] flex-1 md:flex-none h-9 rounded-full text-sm border-border/60 bg-background focus:ring-1 focus:border-border">
          <SelectValue placeholder={categoryPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{categoryPlaceholder}</SelectItem>
          {categoryOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.date}
        onValueChange={(val) => onFilterChange("date", val as DateFilter)}
      >
        <SelectTrigger className="w-auto min-w-[140px] flex-1 md:flex-none h-9 rounded-full text-sm border-border/60 bg-background focus:ring-1 focus:border-border">
          <SelectValue placeholder="All Time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Time</SelectItem>
          <SelectItem value="TODAY">Today</SelectItem>
          <SelectItem value="THIS_WEEK">This Week</SelectItem>
          <SelectItem value="THIS_MONTH">This Month</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(val) => onFilterChange("status", val as StatusFilter)}
      >
        <SelectTrigger className="w-auto min-w-[130px] flex-1 md:flex-none h-9 rounded-full text-sm border-border/60 bg-background focus:ring-1 focus:border-border">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active Only</SelectItem>
          <SelectItem value="INACTIVE">Inactive Only</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="h-9 px-3 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
