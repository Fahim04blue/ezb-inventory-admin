# Inventory Admin Project Skill

Use this file as project context when generating, reviewing, or modifying code for this repository.

## What This Project Is

A private Next.js admin panel for managing a small beauty care product business.

The business buys products from local and foreign sources, stores currency rates, pays cargo/weight charges, receives stock, sells through Facebook/Instagram/WhatsApp, and tracks expenses and profit.

The app must simplify the owner’s daily workflow and replace complicated spreadsheet management.

The MVP includes simple JWT authentication for internal users and protected dashboard routes.

## What This Project Is Not

Do not treat this as:
- A public ecommerce storefront
- A CRM
- A full ERP
- A POS system
- An accounting system
- A marketing automation platform
- A multi-vendor marketplace
- A mobile app

Do not add unrelated complexity.

## Core Business Flow

1. Buy products from supplier, wholesale, online, or international source.
2. Product purchase price may be in BDT, MYR, THB, CNY, or USD.
3. Card purchase exchange rate and cargo payment exchange rate may be different.
4. Store currency rates and also store the actual rate snapshots used in each purchase.
5. Products may have product weight and shipping weight.
6. Cargo/weight charge and import cost are added to landed product cost in BDT.
7. Products are received into stock.
8. Orders come from Facebook, Instagram, WhatsApp, offline, or other source.
9. Expenses are recorded.
10. Profit is calculated from landed cost and expenses.

## Most Important Product Rule

The real cost of a product is landed cost in BDT.

Landed cost = buying cost in BDT + allocated cargo/weight charge in BDT + allocated other import cost in BDT.

Do not calculate profit using only buying cost if cargo/weight charge exists.

Store exchange-rate snapshots and final BDT values directly in purchase records so old calculations never change.

## Core UX Principle

The UI should be action-based:
- Add Purchase
- Receive Stock
- Create Order
- Add Expense
- Manage Currency Rates
- Send PR/Giveaway
- Stock Check
- View Reports

The user should not need to understand database tables.

## MVP Modules

Build only:
- Dashboard
- Inventory
- Purchasing
- Sales
- Finance
- Authentication

Concrete MVP routes/modules:
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

Do not build CRM, AI, public ecommerce, payment gateway, invoice PDF, or complex multi-user permissions unless requested.

## Database Tables

Core tables:
- users
- currency_rates
- products
- brands
- categories
- product_variants
- suppliers
- purchases
- purchase_items
- stock_movements
- orders
- order_items
- expenses

Optional later:
- customers
- marketing_campaigns
- settings

## Purchase Rules

Creating a purchase does not automatically increase stock unless received immediately.

Purchase must support:
- purchase currency
- purchase/card exchange rate
- cargo currency
- cargo payment exchange rate
- country
- foreign subtotal
- BDT subtotal
- cargo charge in foreign currency if needed
- cargo charge in BDT
- other import cost in BDT
- total landed cost in BDT

Important:
- Store purchase exchange rate snapshots directly in `Purchase`
- Do not rely only on live `CurrencyRate` for old accounting
- Cargo/weight charge is part of landed cost
- Ads are not part of landed cost

## Purchase Item Rules

Each `PurchaseItem` should store:
- `unitPriceForeign`
- `unitBuyingCostBdt`
- `productWeight`
- `shippingWeight`
- `allocatedCargoCostBdt`
- `allocatedOtherCostBdt`
- `finalUnitLandedCostBdt`
- `totalLandedCostBdt`
- `suggestedSellingPrice`
- `quantity`
- `receivedQuantity`

Do not rely on live `ProductVariant` cost for old purchase calculations.

## Product Variant Rules

Stock belongs to product variants.

Variants should support:
- `currentStock`
- `lowStockAlert`
- `defaultSellingPrice`
- `productWeight`
- `shippingWeight`
- `isActive`

Every stock change must create a stock movement.

## Product Option Rules

Products must use predefined Brand and Category options.

Do not use free-text brand/category fields in product create or update flows.

Manage Brand and Category from the combined `Product Options` settings page at `/settings/product-options`.

Do not create separate sidebar pages for Brand and Category.

## Order Rules

When creating/confirming an order:
- Create order.
- Create order items.
- Save unit selling price.
- Save unit cost at time of sale.
- Reduce stock.
- Create SALE stock movements.
- Calculate profit.
- Use a transaction.

`OrderItem` must store:
- `unitSellingPrice`
- `unitCost`
- `totalSellingPrice`
- `totalCost`
- `profit`

Old order profit must not change if product cost changes later.

## Expense Rules

Expenses reduce net profit.

Categories include:
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

Business rule:
- Cargo/weight charge can also be tracked as expense for cash flow
- But if it is part of import cost, it must also be included in purchase landed cost
- Ads are expenses only

## Authentication Rules

Use simple JWT-based authentication in MVP.

Requirements:
- Store only `passwordHash`, never plain-text passwords
- Support only `OWNER` and `ADMIN` roles
- Protect dashboard/internal app routes
- Keep auth simple and internal-use focused

## Route Structure Requirement

Maintain grouped protected routes under:

```txt
src/app/(dashboard)/
  dashboard/
    page.tsx
  settings/
    product-options/
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
```

Keep shared protected layout at:
- `src/app/(dashboard)/layout.tsx`

## Navigation Structure

Use grouped navigation:

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

## Code Quality Rules

- Use TypeScript strictly
- Use Prisma Decimal for money and exchange rates
- Use Zod for validation
- Keep business logic server-side
- Use transactions for multi-step workflows
- Keep page.tsx files thin
- Use feature modules
- Keep auth and route protection server-enforced
- Prefer readable code over clever abstractions
- Avoid premature optimization
- Avoid over-engineering

## Build Order

1. Initialize Next.js project
2. Add Prisma/PostgreSQL
3. Define schema
4. Add authentication and protected routes
5. Add currency rates
6. Build product and variant module
7. Build supplier module
8. Build purchase module
9. Build receive stock workflow
10. Build stock movements
11. Build order workflow
12. Build expenses
13. Build dashboard
14. Build reports
15. Add stock check/adjustment
16. Polish UI and validation

## Success Criteria

The system is successful when the owner no longer needs a spreadsheet for daily operations and can manage:
- secure sign-in and protected internal access
- currency rates
- buying products in foreign or local currency
- cargo cost and different exchange rates
- receiving stock
- selling orders
- expenses
- profit
- low stock

from the admin panel.
