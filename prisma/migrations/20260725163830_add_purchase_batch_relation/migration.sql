/*
  Warnings:

  - Added the required column `purchaseId` to the `ProductBatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductBatch" ADD COLUMN     "purchaseId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
