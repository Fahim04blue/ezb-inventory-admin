# AGENTS.md

## Project Identity

This project is a private internal admin panel for a small beauty care product business.

The app replaces spreadsheet-based tracking with a workflow-based system for:
- Product and variant management
- Predefined product brand and category management
- Purchasing from local and foreign suppliers
- Currency rate tracking
- Cargo and weight charge allocation
- Inventory and stock tracking
- Orders and sales
- Expenses
- PR send and giveaway tracking
- Profit and business insights

This is not a public ecommerce website, not a CRM, and not a full ERP.

The main users are the business owner and his wife. Optimize for fast daily use, low friction, clear business logic, and reliable stock/profit calculations.

## Tech Stack

Use this stack unless explicitly changed:

- Framework: Next.js App Router
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- UI: Tailwind CSS + shadcn/ui
- Forms: React Hook Form + Zod
- Charts: Recharts
- Icons: Lucide React
- Package manager: npm preferred
- Auth: simple JWT auth in MVP with protected dashboard routes

## Product Philosophy

Build an action-based admin panel, not a spreadsheet clone.

Daily workflow:
- Bought products? Use Add Purchase.
- Products arrived? Use Receive Stock.
- Got an order? Use Create Order.
- Spent money? Use Add Expense.
- Updated rate? Use Currency Rates.
- Sent PR/giveaway? Use PR/Giveaway.
- Stock mismatch? Use Stock Check/Adjustment.

The user should not need to manually update many tables for one business action.

## Business Process

1. Products are bought from online shops, wholesalers, or suppliers from different countries.
2. Product purchase price may be in MYR, THB, CNY, USD, or BDT.
3. Card purchase exchange rate and cargo payment exchange rate can be different.
4. Currency rates must be stored because rates change and old purchase accounting must remain stable.
5. Products can have product size/content (value and unit) and shipping weight.
6. Cargo charge differs by country, supplier, or cargo agent and must be added to landed product cost.
7. Final accounting must be stored in BDT.
8. Product landed cost must include:
   product buying cost in BDT + allocated cargo cost in BDT + allocated import/other purchase cost in BDT.
9. Ads, PR, giveaway, courier, and packaging are expenses, not landed cost, unless explicitly part of import/purchase cost.
10. Products are received into inventory only when physically received.
11. Orders reduce stock and calculate profit using landed cost saved at the time of sale.
12. Old purchase and order calculations must not change if rates or product costs are edited later.
13. Product size/content must store value and unit (e.g., 250 ML, 50 G, 1 PCS).
14. Shipping weight must be stored in kg. Cargo calculation uses shippingWeightKg. Product size/content is for product identity/display, not cargo calculation.

## Critical Costing Rule

Product cost must support landed cost in BDT.

Landed cost = product buying cost in BDT + allocated cargo/weight charge in BDT + allocated import/other purchase cost in BDT.

Store exchange rate snapshots and final BDT values directly on Purchase and PurchaseItem records.

Do not mix ad cost into landed product cost. Ads are business expenses, not product acquisition cost.

## MVP Scope

Build these modules first:
1. Dashboard
2. Inventory
3. Purchasing
4. Sales
5. Finance
6. Authentication

Inside MVP modules:
- Dashboard
- Product Options
- Products
- Stock Movements
- Stock Check/Adjustment
- Purchases
- Receive Stock
- Suppliers
- Currency Rates
- Orders
- Expenses
- Reports

## Do Not Build in MVP

Do not implement unless explicitly requested:
- Public storefront
- Customer checkout
- Payment gateway
- Full CRM
- Multi-warehouse inventory
- Barcode scanner
- Invoice PDF
- Accounting ledger
- AI chatbot
- AI insights
- Mobile app
- Complex user roles beyond OWNER and ADMIN
- Marketing automation
- Email/SMS campaigns

## Recommended Database Tables

Start with these core tables:
1. users
2. currency_rates
3. products
4. brands
5. categories
6. product_variants
7. suppliers
8. purchases
9. purchase_items
10. stock_movements
11. orders
12. order_items
13. expenses

Optional later:
- customers
- marketing_campaigns
- settings
- media/assets

## Database Design Rules

- Stock is tracked at product variant level.
- Never track stock only at product level.
- Every stock change must create a stock movement.
- Do not silently update stock without history.
- Order item unit cost must be saved at the time of sale.
- Old order profit must not change when product cost changes later.
- Old purchase accounting must not change when currency rates change later.
- Use Decimal for money and exchange-rate fields in Prisma, not Float.
- Use Int for stock quantity.
- Use enums for currency, statuses, sources, movement types, and expense categories.
- Use Prisma transactions for multi-step business actions.

## Core Entities

### CurrencyRate

Represents an exchange rate used in business operations.

Use cases:
- Card purchase rate
- Cargo payment rate
- Manual internal rate

Rates change over time, so store snapshots and effective dates.

### Product

Represents a base product family.

Products must use predefined Brand and Category options.

Do not use messy free-text brand/category values in product create or update flows.

Manage Brand and Category from the combined Product Options settings page.

Do not create separate sidebar pages for Brand and Category.

### Product Variant

Represents the actual sellable stock item.

Stock belongs to variants.

Variants may carry default:
- product size/content (value and unit)
- shipping weight (kg)
- default selling price
- low stock alert

### Supplier

Represents a source of goods for purchasing.

### Purchase

Represents a batch, shipment, or supplier order.

Purchase must support:
- product purchase currency
- purchase/card exchange rate
- cargo currency
- cargo payment exchange rate
- country
- purchase date (stored separately from createdAt)
- final BDT accounting snapshot

### Purchase Item

Represents a product variant inside a purchase.

Stores:
- unit foreign price
- BDT buying cost
- product size value and unit
- shipping weight in kg
- allocated cargo cost in BDT
- allocated other cost in BDT
- final landed cost in BDT
- received quantity

### Stock Movement

Audit trail for all stock changes.

Types:
- PURCHASE_RECEIVE
- SALE
- RETURN
- DAMAGE
- ADJUSTMENT_IN
- ADJUSTMENT_OUT
- GIVEAWAY
- PR_SEND

### Order

Represents a sale from Facebook, Instagram, WhatsApp, offline, or other source.

### Order Item

Stores:
- unit selling price
- unit cost at time of sale
- total selling price
- total cost
- profit

Old order profit must not change when later costs change.

### Expense

Represents business expenses that reduce net profit.

Cargo/weight charge may be tracked as an expense for cash flow, but it must also be included in landed cost if it is part of import cost.

## Status Enums

### UserRole
- OWNER
- ADMIN

### Currency
- BDT
- MYR
- THB
- CNY
- USD

### CurrencyRateType
- CARD_PURCHASE
- CARGO_PAYMENT
- MANUAL
- OTHER

### PurchaseStatus
- ORDERED
- IN_CARGO
- RECEIVED
- PARTIALLY_RECEIVED
- CANCELLED

### PaymentStatus
- UNPAID
- PARTIAL
- PAID
- REFUNDED

### OrderStatus
- PENDING
- CONFIRMED
- DELIVERED
- CANCELLED
- RETURNED

### OrderSource
- FACEBOOK
- INSTAGRAM
- WHATSAPP
- OFFLINE
- OTHER

### StockMovementType
- PURCHASE_RECEIVE
- SALE
- RETURN
- DAMAGE
- ADJUSTMENT_IN
- ADJUSTMENT_OUT
- GIVEAWAY
- PR_SEND

### StockMovementDirection
- IN
- OUT

### ExpenseCategory
- PRODUCT_PURCHASE
- CARGO_WEIGHT_CHARGE
- PACKAGING
- COURIER
- FACEBOOK_BOOST
- INSTAGRAM_BOOST
- META_ADS
- GIVEAWAY
- PR_PROMOTION
- DAMAGE_LOSS
- TRANSPORT
- PAYMENT_CHARGE
- REFUND
- TOOLS_SUBSCRIPTION
- OTHER

## Business Logic Rules

### Currency Rates

- Maintain reusable currency rate records.
- Purchase/card rate and cargo payment rate can be different.
- Store actual rate snapshots directly in Purchase even if a CurrencyRate relation exists.

### Adding a Purchase

When a purchase is created:
- Create purchase record.
- Create purchase item records.
- Store purchase currency and exchange rate.
- Store cargo currency and exchange rate if used.
- Calculate foreign subtotal.
- Calculate BDT subtotal.
- Store cargo charge and other import cost in BDT.
- Calculate total landed cost in BDT.
- Do not increase stock yet unless purchase is marked received immediately.

### Receiving Stock

When a purchase or purchase item is received:
- Create PURCHASE_RECEIVE stock movements.
- Increase product variant current stock.
- Store received quantity.
- Use final unit landed cost from purchase item.
- Use a Prisma transaction.
- Do not receive more than purchased quantity.

### Creating an Order

When an order is created or confirmed according to MVP rule:
- Create order.
- Create order items.
- Save unit selling price.
- Save unit cost at time of sale.
- Reduce stock.
- Create SALE stock movements.
- Calculate subtotal, product cost, gross profit, total amount, and net order profit.
- Use a Prisma transaction.
- Do not allow negative stock unless explicitly requested.

### PR Send / Giveaway

When a product is sent for PR/giveaway:
- Reduce stock.
- Create PR_SEND or GIVEAWAY stock movement.
- Create related expense if needed.

### Expenses

Expenses affect net profit but usually do not affect stock.

Ads are expenses only.

Courier, packaging, PR, giveaway, and similar items are expenses unless explicitly part of import cost.

## Profit Formulas

### Purchase

product_subtotal_foreign = sum(purchase_item.quantity * purchase_item.unit_price_foreign)

product_subtotal_bdt = sum(purchase_item.quantity * purchase_item.unit_buying_cost_bdt)

total_landed_cost_bdt = product_subtotal_bdt + cargo_charge_bdt + other_import_cost_bdt

final_unit_landed_cost_bdt =
unit_buying_cost_bdt + allocated_cargo_cost_bdt + allocated_other_cost_bdt

### Order

item_total = quantity * unit_selling_price

item_cost = quantity * unit_cost

item_profit = item_total - item_cost

## Folder Structure

Use a modular Next.js structure with protected dashboard routing:

```txt
src/
  app/
    (dashboard)/
      layout.tsx
      dashboard/
        page.tsx
      inventory/
        products/
          page.tsx
        stock-movements/
          page.tsx
        stock-check/
          page.tsx
      purchasing/
        purchases/
          page.tsx
        receive-stock/
          page.tsx
        suppliers/
          page.tsx
        currency-rates/
          page.tsx
      sales/
        orders/
          page.tsx
      finance/
        expenses/
          page.tsx
        reports/
          page.tsx
      settings/
        product-options/
          page.tsx
    login/
      page.tsx
    api/
      health/
        route.ts
  components/
    ui/
    layout/
    common/
  features/
    auth/
    products/
    purchases/
    orders/
    expenses/
    stock/
    reports/
    dashboard/
  lib/
    prisma.ts
    utils.ts
    formatters.ts
    constants.ts
  prisma/
    schema/
```

## Navigation Structure

Sidebar should be grouped like this:

- Dashboard
  Dashboard
- Settings
  Product Options
- Inventory
  Products
  Stock Movements
  Stock Check
- Purchasing
  Purchases
  Receive Stock
  Suppliers
  Currency Rates
- Sales
  Orders
- Finance
  Expenses
  Reports

## Feature Module Rules

- Keep page files thin.
- Put business logic in feature services/actions.
- Use Zod for validation.
- Use Prisma transactions for multi-step business workflows.
- Do not over-engineer.

## Security

MVP includes simple JWT authentication for internal use.

- Protect dashboard and internal admin routes.
- Store only `passwordHash`, never raw passwords.
- Support only `OWNER` and `ADMIN` roles in MVP.
- Do not expose publicly without protection.

## Environment Variables

Use `.env` for:

```txt
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_NAME=
JWT_SECRET=
JWT_EXPIRES_IN=
ALLOW_REGISTRATION=
```

## Development Approach

Build in this order:
1. Project setup
2. Prisma schema
3. Authentication and protected routes
4. Currency rates
5. Product options
6. Products and variants
7. Suppliers
8. Purchases and purchase items
9. Receive stock workflow
10. Stock movements
11. Orders and order items
12. Expenses
13. Dashboard
14. Reports
15. Stock check/adjustment
16. Polish and validation

## Definition of Done for MVP

The MVP is done when the owner can:
1. Sign in securely to access the admin panel.
2. Manage currency rates.
3. Add products and variants.
4. Add a purchase/shipment with foreign currency and rate snapshots.
5. Add cargo/weight charge to purchase landed cost.
6. Receive stock and see current stock update.
7. Create an order and see stock reduce.
8. Add expenses.
9. Send PR/giveaway and see stock reduce.
10. Check dashboard for sales, expenses, profit, and low stock.
11. View reports.
12. Manage the business without maintaining a spreadsheet.

## Frontend Component Architecture Rules

This project uses Next.js App Router with a feature-based frontend architecture.

Route files must stay thin.

### Core Rule

If a file defines a URL route, it belongs inside `src/app`.

If a file contains feature UI, forms, tables, drawers, loading states, validation, types, API helpers, or business logic, it belongs inside `src/features`.

Do not write full CRUD screens directly inside `page.tsx`.

Do not put an entire CRUD page inside one large `*-page-client.tsx` file.

A `*-page-client.tsx` file may coordinate state and pass props, but it must not contain the full table, form, drawer, mobile cards, empty state, and all action handlers in one file.

### Thin Page Rule

Files like:

```txt
src/app/(dashboard)/inventory/products/page.tsx
```

should only import and render the feature page component.

Example:

```tsx
import { ProductsPageClient } from "@/features/products/components/products-page-client";

export default function ProductsPage() {
  return <ProductsPageClient />;
}
```

### Feature Component Split Rule

Every CRUD feature should be split into smaller components.

Example for Products:

```txt
src/features/products/
  components/
    products-page-client.tsx
    products-page-header.tsx
    products-list.tsx
    products-table.tsx
    product-mobile-card-list.tsx
    product-form-drawer.tsx
    product-form.tsx
    product-variant-fields.tsx
    product-empty-state.tsx
    product-status-badge.tsx
  schemas/
    product.schema.ts
  services/
    product.service.ts
  types/
    product.types.ts
```

Example for Suppliers:

```txt
src/features/suppliers/
  components/
    suppliers-page-client.tsx
    suppliers-page-header.tsx
    suppliers-list.tsx
    suppliers-table.tsx
    supplier-mobile-card-list.tsx
    supplier-form-drawer.tsx
    supplier-form.tsx
    supplier-empty-state.tsx
  schemas/
    supplier.schema.ts
  services/
    supplier.service.ts
  types/
    supplier.types.ts
```

Example for Currency Rates:

```txt
src/features/currency-rates/
  components/
    currency-rates-page-client.tsx
    currency-rates-page-header.tsx
    currency-rates-list.tsx
    currency-rates-table.tsx
    currency-rate-mobile-card-list.tsx
    currency-rate-form-drawer.tsx
    currency-rate-form.tsx
    currency-rate-empty-state.tsx
  schemas/
    currency-rate.schema.ts
  services/
    currency-rate.service.ts
  types/
    currency-rate.types.ts
```

Example for Product Options:

```txt
src/features/product-options/
  components/
    product-options-page-client.tsx
    product-options-page-header.tsx
    brands-section.tsx
    categories-section.tsx
    brands-table.tsx
    categories-table.tsx
    brand-form-drawer.tsx
    category-form-drawer.tsx
    brand-form.tsx
    category-form.tsx
    product-options-empty-state.tsx
  schemas/
    brand.schema.ts
    category.schema.ts
  services/
    brand.service.ts
    category.service.ts
  types/
    product-options.types.ts
```

### Component Responsibility Rules

`products-page-client.tsx` should only:

* manage page-level state
* load or refresh page data
* manage drawer open/close state
* manage selected item for edit
* pass props to child components

It should not contain:

* full table JSX
* full form JSX
* full drawer JSX
* all mobile card rendering
* all empty state rendering
* all skeleton loading UI

`products-page-header.tsx` should contain:

* page title
* page description
* refresh button
* add button

`products-list.tsx` should decide whether to show:

* loading skeleton
* empty state
* desktop table
* mobile card list

`products-table.tsx` should contain desktop table rendering only.

`product-mobile-card-list.tsx` should contain mobile card rendering only.

`product-form-drawer.tsx` should contain only the shadcn Sheet/drawer wrapper.

`product-form.tsx` should contain the form fields and submit behavior.

Use the same pattern for all CRUD pages.

### CRUD UX Pattern

Every CRUD page must follow this pattern:

1. Show list/table/card view first.
2. Do not show create form by default.
3. Add button must be in the top-right page header.
4. Add opens a right-side drawer/sheet.
5. Edit opens the same drawer/sheet with existing data.
6. Use active/inactive status instead of hard delete unless explicitly requested.
7. After successful create/update/status change:

   * close drawer if applicable
   * refresh/revalidate the list
   * show success message/toast if toast system exists

Apply this pattern to:

* Products
* Product Options
* Suppliers
* Currency Rates
* Purchases
* Orders
* Expenses
* Any future CRUD page

### Loading State Rules

Every CRUD list must have skeleton loading states.

Use reusable loading components where possible:

```txt
src/components/common/table-skeleton.tsx
src/components/common/card-list-skeleton.tsx
```

Desktop:

* show table skeleton with 5 to 8 rows

Mobile:

* show card skeleton with 3 to 5 cards

Do not show blank white space while loading.

### Responsive Layout Rules

All CRUD pages must be mobile responsive.

Desktop:

* table layout is allowed
* drawer should open from right side
* drawer width should be around 480px to 640px depending on form size

Mobile:

* use card list or mobile-safe layout
* drawer/sheet should be full width
* buttons should be easy to tap
* no horizontal overflow unless absolutely unavoidable

### Shared Component Rules

Shared reusable components should go inside:

```txt
src/components/common
src/components/layout
```

Feature-specific components should stay inside:

```txt
src/features/<feature-name>/components
```

Do not duplicate common components inside multiple feature folders.

### API Route Architecture Rule

API route files must stay thin.

Files like:

```txt
src/app/api/products/route.ts
src/app/api/products/[id]/route.ts
```

should call service functions from:

```txt
src/features/products/services/product.service.ts
```

Do not put large Prisma/business logic directly inside route handlers.

### Refactor Rule

When a page or component becomes large, refactor it before adding more functionality.

Do not add new features on top of a large monolithic component.

If a `*-page-client.tsx` file contains page state, table rendering, form rendering, drawer rendering, and API logic together, split it before continuing.
