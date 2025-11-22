-- AlterTable
ALTER TABLE "WarrantyItem" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- UpdateExistingRows
UPDATE "WarrantyItem" SET "currency" = 'EUR' WHERE "currency" = 'BGN';
