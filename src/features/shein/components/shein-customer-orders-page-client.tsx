"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Search, Truck, UsersRound } from "lucide-react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import type { SheinCustomerOrderGroup } from "../types/shein.types";
import { SheinCustomerOrderCreateDrawer } from "./shein-customer-order-create-drawer";
import { SheinCustomerOrderDetailsDrawer } from "./shein-customer-order-details-drawer";
import { SheinCustomerOrdersList } from "./shein-customer-orders-list";

const statuses = ["ALL", "READY_FOR_DELIVERY", "PARTIALLY_ARRIVED", "WAITING", "COMPLETED", "CANCELLED"];

export function SheinCustomerOrdersPageClient() {
  const [groups, setGroups] = useState<SheinCustomerOrderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [createKey, setCreateKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ customerOrders: SheinCustomerOrderGroup[] }>("/api/shein/customer-orders", { cache: "no-store", showErrorToast: false });
      setGroups(data.customerOrders);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesSearch = !search || [
        group.customerName,
        group.phone,
        group.customerSource ?? "",
        ...group.items.flatMap((item) => [item.productName, item.sku ?? ""]),
      ].some((value) => value.toLowerCase().includes(search));
      return matchesSearch && (status === "ALL" || group.status === status);
    });
  }, [groups, query, status]);
  const selected = groups.find((group) => group.key === selectedKey) ?? null;
  const createGroup = groups.find((group) => group.key === createKey) ?? null;
  const totalCustomers = groups.length;
  const readyForOrder = groups.filter((group) => group.status === "READY_FOR_DELIVERY").length;
  const pendingItems = groups.reduce((sum, group) => sum + group.waitingItems, 0);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">SHEIN Customer Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track customer-wise SHEIN items across batches.</p>
      </div>

      <div className="flex rounded-xl border bg-card p-2 shadow-sm">
        <Link className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-muted" href="/shein/batches">
          Batches
        </Link>
        <Link className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium !text-white shadow-sm hover:!text-white" href="/shein/customer-orders">
          Customer Orders
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <MetricCard
          icon={UsersRound}
          label="Total Customers"
          tone="green"
          value={String(totalCustomers)}
          helper="Across all batches"
        />
        <MetricCard
          icon={Truck}
          label="Ready for Order"
          tone="green"
          value={String(readyForOrder)}
          helper="Customers ready to create order"
        />
        <MetricCard
          icon={Clock}
          label="Pending / Waiting Items"
          tone="amber"
          value={String(pendingItems)}
          helper="Items awaiting arrival"
        />
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-9" placeholder="Search customer, phone, address..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <SheinCustomerOrdersList
        groups={filtered}
        isLoading={isLoading}
        onCreate={(group) => setCreateKey(group.key)}
        onOpen={(group) => setSelectedKey(group.key)}
      />
      <SheinCustomerOrderDetailsDrawer group={selected} onClose={() => setSelectedKey(null)} />
      <SheinCustomerOrderCreateDrawer key={createGroup?.key ?? "closed"} group={createGroup} onClose={() => setCreateKey(null)} onSuccess={() => { setCreateKey(null); loadData(); }} />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  helper: string;
  tone: "green" | "amber";
}) {
  const toneClass = tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-600";

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}
