-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BDT', 'MYR', 'THB', 'CNY', 'USD');

-- CreateEnum
CREATE TYPE "CurrencyRateType" AS ENUM ('CARD_PURCHASE', 'CARGO_PAYMENT', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('ORDERED', 'IN_CARGO', 'RECEIVED', 'PARTIALLY_RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'OFFLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_RECEIVE', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'GIVEAWAY', 'PR_SEND');

-- CreateEnum
CREATE TYPE "StockMovementDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('PRODUCT_PURCHASE', 'CARGO_WEIGHT_CHARGE', 'PACKAGING', 'COURIER', 'FACEBOOK_BOOST', 'INSTAGRAM_BOOST', 'META_ADS', 'GIVEAWAY', 'PR_PROMOTION', 'DAMAGE_LOSS', 'TRANSPORT', 'PAYMENT_CHARGE', 'REFUND', 'TOOLS_SUBSCRIPTION', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER,
    "currentLandedCost" DECIMAL(14,4),
    "defaultSellingPrice" DECIMAL(14,4),
    "productWeight" DECIMAL(10,3),
    "shippingWeight" DECIMAL(10,3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_rates" (
    "id" SERIAL NOT NULL,
    "currency" "Currency" NOT NULL,
    "rateType" "CurrencyRateType" NOT NULL,
    "rateToBdt" DECIMAL(14,6) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "country" TEXT,
    "source" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,4) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "relatedPurchaseId" INTEGER,
    "relatedOrderId" INTEGER,
    "relatedVariantId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "productVariantId" INTEGER NOT NULL,
    "purchaseId" INTEGER,
    "purchaseItemId" INTEGER,
    "orderId" INTEGER,
    "orderItemId" INTEGER,
    "type" "StockMovementType" NOT NULL,
    "direction" "StockMovementDirection" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(14,4),
    "totalCost" DECIMAL(14,4),
    "note" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "source" "OrderSource" NOT NULL DEFAULT 'OTHER',
    "customerName" TEXT,
    "customerPhone" TEXT,
    "notes" TEXT,
    "orderedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "subtotal" DECIMAL(14,4) NOT NULL,
    "discount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "deliveryChargeCollected" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "courierCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "totalProductCost" DECIMAL(14,4) NOT NULL,
    "grossProfit" DECIMAL(14,4) NOT NULL,
    "netOrderProfit" DECIMAL(14,4) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productVariantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitSellingPrice" DECIMAL(14,4) NOT NULL,
    "unitCost" DECIMAL(14,4) NOT NULL,
    "totalSellingPrice" DECIMAL(14,4) NOT NULL,
    "totalCost" DECIMAL(14,4) NOT NULL,
    "profit" DECIMAL(14,4) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" SERIAL NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "title" TEXT,
    "supplierId" INTEGER,
    "purchaseCurrency" "Currency" NOT NULL,
    "purchaseExchangeRateToBdt" DECIMAL(14,6) NOT NULL,
    "purchaseRateId" INTEGER,
    "cargoCurrency" "Currency",
    "cargoExchangeRateToBdt" DECIMAL(14,6),
    "cargoRateId" INTEGER,
    "orderedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "status" "PurchaseStatus" NOT NULL DEFAULT 'ORDERED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "country" TEXT,
    "notes" TEXT,
    "productSubtotalForeign" DECIMAL(14,4) NOT NULL,
    "productSubtotalBdt" DECIMAL(14,4) NOT NULL,
    "cargoChargeForeign" DECIMAL(14,4),
    "cargoChargeBdt" DECIMAL(14,4),
    "otherImportCostBdt" DECIMAL(14,4),
    "totalLandedCostBdt" DECIMAL(14,4) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "productVariantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitPriceForeign" DECIMAL(14,4) NOT NULL,
    "unitBuyingCostBdt" DECIMAL(14,4) NOT NULL,
    "productWeight" DECIMAL(10,3),
    "shippingWeight" DECIMAL(10,3),
    "allocatedCargoCostBdt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "allocatedOtherCostBdt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "finalUnitLandedCostBdt" DECIMAL(14,4) NOT NULL,
    "totalLandedCostBdt" DECIMAL(14,4) NOT NULL,
    "suggestedSellingPrice" DECIMAL(14,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_createdById_idx" ON "products"("createdById");

-- CreateIndex
CREATE INDEX "products_updatedById_idx" ON "products"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_isActive_idx" ON "product_variants"("isActive");

-- CreateIndex
CREATE INDEX "product_variants_currentStock_idx" ON "product_variants"("currentStock");

-- CreateIndex
CREATE INDEX "product_variants_createdById_idx" ON "product_variants"("createdById");

-- CreateIndex
CREATE INDEX "product_variants_updatedById_idx" ON "product_variants"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_name_key" ON "product_variants"("productId", "name");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "suppliers_createdById_idx" ON "suppliers"("createdById");

-- CreateIndex
CREATE INDEX "suppliers_updatedById_idx" ON "suppliers"("updatedById");

-- CreateIndex
CREATE INDEX "currency_rates_currency_rateType_effectiveDate_idx" ON "currency_rates"("currency", "rateType", "effectiveDate");

-- CreateIndex
CREATE INDEX "currency_rates_isActive_idx" ON "currency_rates"("isActive");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "expenses_category_expenseDate_idx" ON "expenses"("category", "expenseDate");

-- CreateIndex
CREATE INDEX "expenses_relatedPurchaseId_idx" ON "expenses"("relatedPurchaseId");

-- CreateIndex
CREATE INDEX "expenses_relatedOrderId_idx" ON "expenses"("relatedOrderId");

-- CreateIndex
CREATE INDEX "expenses_relatedVariantId_idx" ON "expenses"("relatedVariantId");

-- CreateIndex
CREATE INDEX "expenses_createdById_idx" ON "expenses"("createdById");

-- CreateIndex
CREATE INDEX "expenses_updatedById_idx" ON "expenses"("updatedById");

-- CreateIndex
CREATE INDEX "stock_movements_productVariantId_createdAt_idx" ON "stock_movements"("productVariantId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_productVariantId_type_createdAt_idx" ON "stock_movements"("productVariantId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_direction_idx" ON "stock_movements"("direction");

-- CreateIndex
CREATE INDEX "stock_movements_purchaseId_idx" ON "stock_movements"("purchaseId");

-- CreateIndex
CREATE INDEX "stock_movements_purchaseItemId_idx" ON "stock_movements"("purchaseItemId");

-- CreateIndex
CREATE INDEX "stock_movements_orderId_idx" ON "stock_movements"("orderId");

-- CreateIndex
CREATE INDEX "stock_movements_orderItemId_idx" ON "stock_movements"("orderItemId");

-- CreateIndex
CREATE INDEX "stock_movements_createdById_idx" ON "stock_movements"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "orders_source_idx" ON "orders"("source");

-- CreateIndex
CREATE INDEX "orders_orderedAt_idx" ON "orders"("orderedAt");

-- CreateIndex
CREATE INDEX "orders_deliveredAt_idx" ON "orders"("deliveredAt");

-- CreateIndex
CREATE INDEX "orders_status_orderedAt_idx" ON "orders"("status", "orderedAt");

-- CreateIndex
CREATE INDEX "orders_source_orderedAt_idx" ON "orders"("source", "orderedAt");

-- CreateIndex
CREATE INDEX "orders_createdById_idx" ON "orders"("createdById");

-- CreateIndex
CREATE INDEX "orders_updatedById_idx" ON "orders"("updatedById");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productVariantId_idx" ON "order_items"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_referenceNumber_key" ON "purchases"("referenceNumber");

-- CreateIndex
CREATE INDEX "purchases_supplierId_idx" ON "purchases"("supplierId");

-- CreateIndex
CREATE INDEX "purchases_purchaseRateId_idx" ON "purchases"("purchaseRateId");

-- CreateIndex
CREATE INDEX "purchases_cargoRateId_idx" ON "purchases"("cargoRateId");

-- CreateIndex
CREATE INDEX "purchases_status_idx" ON "purchases"("status");

-- CreateIndex
CREATE INDEX "purchases_paymentStatus_idx" ON "purchases"("paymentStatus");

-- CreateIndex
CREATE INDEX "purchases_orderedAt_idx" ON "purchases"("orderedAt");

-- CreateIndex
CREATE INDEX "purchases_receivedAt_idx" ON "purchases"("receivedAt");

-- CreateIndex
CREATE INDEX "purchases_status_orderedAt_idx" ON "purchases"("status", "orderedAt");

-- CreateIndex
CREATE INDEX "purchases_createdById_idx" ON "purchases"("createdById");

-- CreateIndex
CREATE INDEX "purchases_updatedById_idx" ON "purchases"("updatedById");

-- CreateIndex
CREATE INDEX "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_items_productVariantId_idx" ON "purchase_items"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_items_purchaseId_productVariantId_key" ON "purchase_items"("purchaseId", "productVariantId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_relatedPurchaseId_fkey" FOREIGN KEY ("relatedPurchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_relatedOrderId_fkey" FOREIGN KEY ("relatedOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_relatedVariantId_fkey" FOREIGN KEY ("relatedVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "purchase_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_purchaseRateId_fkey" FOREIGN KEY ("purchaseRateId") REFERENCES "currency_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_cargoRateId_fkey" FOREIGN KEY ("cargoRateId") REFERENCES "currency_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
