I am building a private internal inventory/admin dashboard for my small beauty-care product business called Essentials by Zatab.

Please read this full context before answering.

Project goal:
This is not a public ecommerce website. It is an internal admin panel to manage products, purchases, currency rates, cargo/landed cost, stock, sales, expenses, pre-orders, and profit tracking.

Tech stack:

* Next.js App Router
* TypeScript
* PostgreSQL
* Prisma
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* Lucide icons
* Recharts later
* npm only, not pnpm
* Simple JWT auth with protected dashboard routes

Current business workflow:

1. I buy beauty-care products from different countries/suppliers.
2. Product purchase price can be in MYR, THB, CNY, USD, or BDT.
3. Card purchase exchange rate and cargo exchange rate can be different.
   Example:

   * Malaysia card purchase rate: 1 MYR = 31.8 BDT
   * Malaysia cargo payment rate: 1 MYR = 31.5 BDT
4. Currency rates are stored separately.
5. Purchases store exchange rate snapshots so old calculations do not change.
6. Product size/content and shipping weight are different:

   * Product size/content = 250 ML, 50 G, 1 PCS, etc.
   * Shipping weight = cargo-chargeable weight in KG.
7. Landed cost means:
   product buying cost in BDT + allocated cargo cost in BDT + allocated other import cost in BDT.
8. Creating a purchase does not increase stock.
9. Stock only increases when Receive Stock is done.
10. Orders reduce stock.
11. Pre-orders can happen before stock is received and should reserve incoming purchase items, but should not reduce current stock.
12. Expenses track ads, packaging, courier, PR, giveaway, transport, payment charges, damage/loss, and other business costs.
13. Sales Summary is for historical/bulk sales only and should not reduce stock.

Important business rules:

* Products are master/catalog items.
* ProductVariant is the actual sellable item.
* Stock is tracked at ProductVariant level.
* Supplier should be linked to Purchase, not directly to Product.
* Same product can be bought from different suppliers at different prices.
* Every stock change must create a StockMovement.
* OrderItem must store unit cost at time of sale so old profit does not change.
* PurchaseItem must store final landed cost.
* Ads are expenses, not landed product cost.
* Cargo is part of landed cost when it is import/purchase-related.
* Old sales can be entered in Sales Summary instead of detailed orders.

Current modules/pages:

* Dashboard
* Products
* Product Options
* Suppliers
* Currency Rates
* Purchases
* Receive Stock
* Orders
* Expenses
* Sales Summary
* Reports
* Stock Movements
* Stock Check

Navigation grouping:
Dashboard:

* Dashboard

Inventory:

* Products
* Stock Movements
* Stock Check

Purchasing:

* Purchases
* Receive Stock
* Suppliers
* Currency Rates

Sales:

* Orders

Finance:

* Expenses
* Sales Summary
* Reports

Settings:

* Product Options

Route structure:

* /dashboard
* /inventory/products
* /inventory/stock-movements
* /inventory/stock-check
* /purchasing/purchases
* /purchasing/receive-stock
* /purchasing/suppliers
* /purchasing/currency-rates
* /sales/orders
* /finance/expenses
* /finance/sales-summary
* /finance/reports
* /settings/product-options

API response format:
All APIs must return:

Success:
{
"status": "success",
"code": 200,
"message": "...",
"data": {}
}

Error:
{
"status": "error",
"code": 400,
"message": "...",
"data": null
}

Toast rule:

* Frontend must show success/error toast messages using backend response `message`.
* If token is expired, backend returns 401 with message like:
  "Session expired. Please login again."
* Frontend should show toast, logout/clear state, and redirect to /login.

Frontend architecture rules:

* `src/app` only defines routes.
* `page.tsx` files must stay thin.
* Feature UI and logic should live in `src/features`.
* Do not put a full CRUD screen inside one huge `*-page-client.tsx`.
* Split pages into components:

  * page header
  * list/table
  * mobile cards
  * filters
  * pagination
  * drawer
  * form
  * badges
  * empty state
  * skeleton loading

CRUD UX pattern:

* List first.
* Add button top-right.
* Add/Edit opens right-side drawer.
* Create form is not visible by default.
* Status toggle should activate/deactivate instead of hard delete.
* Skeleton loading states are required.
* Mobile responsive.
* No global horizontal scroll.

Current UI/design direction:

* Modern compact SaaS admin dashboard.
* Warm off-white background.
* White/light cards.
* Deep green primary color.
* Soft shadows and rounded corners.
* Compact typography.
* Badges should have meaningful colors.
* Tables should be readable and not pale.
* Page headers should be consistent across all CRUD pages.
* Filters should be pill-style.
* Clear Filters button should be the last filter control.
* Search should be second last before Clear Filters.
* No Apply Filter or Advanced Filter button unless explicitly asked.

Expenses page latest design requirement:

* Header: Expenses + subtitle + Refresh + Add Expense.
* Summary cards:

  * Total Expenses
  * Product Purchases
  * Marketing & PR
  * Courier & Packaging
  * Other Costs
* Filter order:

  1. Category
  2. Date/time
  3. Status
  4. Payment Method
  5. Search title or notes
  6. Clear Filters
* Table columns:

  * Date
  * Title & Notes
  * Category
  * Payment Method
  * Amount
  * Status
  * Actions
* Pagination required:

  * Showing 1–6 of 24
  * page buttons
  * rows per page dropdown
* Add/Edit Expense should use drawer.
* Toasts should use backend messages.

Sales Summary:

* Used for historical/bulk sales.
* Do not reduce stock.
* Remove/hide delivery collected from Sales Summary because courier company settlement already deducts charges.
* Sales Summary should mean money actually received from summarized sales.
* Table should include:

  * Date
  * Title
  * Source
  * Amount Received
  * Status
  * Actions
* Add edit action per row.
* Use same page header style as Products/Expenses.

Purchases:

* One purchase can contain many purchase items.
* If I buy 10 variants from one supplier/order/shipment, that is one Purchase with 10 PurchaseItems, not 10 separate purchases.
* Purchase table should show useful info:

  * Ref
  * Supplier
  * Items Purchased
  * Qty
  * Product Cost
  * Cargo
  * Other
  * Total Landed
  * Status
  * Payment
  * Date
  * Actions
* Expanded details should show item-level costs:

  * Product Variant
  * SKU
  * Qty
  * Received
  * Unit Price
  * Product Cost
  * Weight
  * Cargo Cost
  * Other Cost
  * Final Unit Cost
  * Total Cost
* Purchase form needs purchase date.
* Product variant dropdown in purchase form should be a searchable combobox.
* When variant is selected, auto-fill product size, product unit, shipping weight, and suggested selling price if available.
* Do not auto-fill unit buying price or quantity.

Pre-orders:

* Customers can pre-order items from purchases that are ordered/in cargo.
* Pre-order should reserve incoming purchase item quantity.
* Pre-order should not reduce currentStock.
* currentStock means physical stock in hand.
* availableIncomingQuantity = purchaseItem.quantity - receivedQuantity - reservedPreOrderQuantity.
* When received and fulfilled, stock can be reduced.

Important models/tables:

* users
* brands
* categories
* products
* product_variants
* suppliers
* currency_rates
* purchases
* purchase_items
* stock_movements
* orders
* order_items
* expenses
* sales_summaries

Important enums:
Currency:

* BDT
* MYR
* THB
* CNY
* USD

CurrencyRateType:

* CARD_PURCHASE
* CARGO_PAYMENT
* MANUAL
* OTHER

PurchaseStatus:

* ORDERED
* IN_CARGO
* RECEIVED
* PARTIALLY_RECEIVED
* CANCELLED

PaymentStatus:

* UNPAID
* PARTIAL
* PAID
* REFUNDED

OrderType:

* NORMAL
* PRE_ORDER

OrderStatus:

* PRE_ORDERED
* CONFIRMED
* READY_TO_DELIVER
* DELIVERED
* CANCELLED
* RETURNED

StockMovementType:

* PURCHASE_RECEIVE
* SALE
* RETURN
* DAMAGE
* ADJUSTMENT_IN
* ADJUSTMENT_OUT
* GIVEAWAY
* PR_SEND

ProductUnit:

* ML
* G
* KG
* PCS
* SET

ExpenseCategory:

* PRODUCT_PURCHASE
* CARGO_WEIGHT_CHARGE
* PACKAGING
* COURIER
* FACEBOOK_BOOST
* INSTAGRAM_BOOST
* META_ADS
* GIVEAWAY
* PR_PROMOTION
* DAMAGE_LOSS
* TRANSPORT
* PAYMENT_CHARGE
* REFUND
* TOOLS_SUBSCRIPTION
* OTHER

Development preferences:

* Give me practical Codex/Gemini prompts when I ask.
* Keep steps small.
* Do not over-engineer.
* Do not suggest building ecommerce/public checkout.
* Do not use pnpm.
* Use npm commands only.
* Before schema changes, explain migration impact first.
* If UI is being changed, keep business logic untouched unless I ask.

Current state:

* Products were created in DB.
* Purchases were created in DB.
* Expenses and Sales Summary modules exist.
* We are improving UI/UX page by page.
* I may ask for prompts for Gemini/Codex to implement changes.
