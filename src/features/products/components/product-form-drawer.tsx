import { CrudDrawer } from "@/components/common/crud-drawer";
import { ProductCreateForm, ProductEditForm, VariantEditForm, VariantCreateForm } from "./product-form";
import { type ProductOptionView, type DrawerState } from "../types/product";

export function ProductFormDrawer({
  drawer,
  brands,
  categories,
  onClose,
  onSuccess,
}: {
  drawer: DrawerState;
  brands: ProductOptionView[];
  categories: ProductOptionView[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  return (
    <CrudDrawer
      description={
        drawer?.mode === "create"
          ? "Create a new product with one or more variants."
          : drawer?.mode === "edit-product"
            ? "Update master product details."
            : drawer?.mode === "edit-variant"
              ? "Update variant details. Current stock is read-only."
              : drawer?.mode === "add-variant"
                ? "Add a new variant to this product."
                : undefined
      }
      onClose={onClose}
      open={drawer !== null}
      title={
        drawer?.mode === "create"
          ? "Add Product"
          : drawer?.mode === "edit-product"
            ? "Edit Product"
            : drawer?.mode === "edit-variant"
              ? "Edit Variant"
              : drawer?.mode === "add-variant"
                ? "Add Variant"
                : ""
      }
    >
      {drawer?.mode === "create" ? (
        <ProductCreateForm
          brands={brands}
          categories={categories}
          onSuccess={onSuccess}
        />
      ) : null}
      {drawer?.mode === "edit-product" ? (
        <ProductEditForm
          brands={brands}
          categories={categories}
          onSuccess={onSuccess}
          product={drawer.product}
        />
      ) : null}
      {drawer?.mode === "edit-variant" ? (
        <VariantEditForm onSuccess={onSuccess} variant={drawer.variant} />
      ) : null}
      {drawer?.mode === "add-variant" ? (
        <VariantCreateForm onSuccess={onSuccess} product={drawer.product} />
      ) : null}
    </CrudDrawer>
  );
}
