export type SupplierListItem = {
  id: number;
  name: string;
  country: string | null;
  contactInfo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
