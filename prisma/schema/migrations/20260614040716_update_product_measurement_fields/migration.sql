/*
  Warnings:

  - You are about to drop the column `productWeight` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `shippingWeight` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `productWeight` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `shippingWeight` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `contactPerson` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `suppliers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('ML', 'G', 'KG', 'PCS', 'SET');

-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "productWeight",
DROP COLUMN "shippingWeight",
ADD COLUMN     "productSizeUnit" "ProductUnit",
ADD COLUMN     "productSizeValue" DECIMAL(10,3),
ADD COLUMN     "shippingWeightKg" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "purchase_items" DROP COLUMN "productWeight",
DROP COLUMN "shippingWeight",
ADD COLUMN     "productSizeUnit" "ProductUnit",
ADD COLUMN     "productSizeValue" DECIMAL(10,3),
ADD COLUMN     "shippingWeightKg" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "contactPerson",
DROP COLUMN "email",
DROP COLUMN "phone",
ADD COLUMN     "contactInfo" TEXT,
ADD COLUMN     "country" TEXT;
