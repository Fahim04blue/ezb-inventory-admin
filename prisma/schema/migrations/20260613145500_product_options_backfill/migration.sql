CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");
CREATE INDEX "brands_isActive_idx" ON "brands"("isActive");

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

ALTER TABLE "products"
ADD COLUMN "brandId" INTEGER,
ADD COLUMN "categoryId" INTEGER;

CREATE INDEX "products_brandId_idx" ON "products"("brandId");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

ALTER TABLE "products"
ADD CONSTRAINT "products_brandId_fkey"
FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products"
ADD CONSTRAINT "products_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
