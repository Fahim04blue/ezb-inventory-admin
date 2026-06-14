export type SupplierView = {
  id: number;
  name: string;
  country: string | null;
  contactInfo: string | null;
  notes: string | null;
  isActive: boolean;
};

export type ApiSuccess<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};

export type ApiError = {
  status: "error";
  code: number;
  message: string;
  data: unknown;
};

export type DrawerState = { mode: "create" } | { mode: "edit"; supplier: SupplierView } | null;
