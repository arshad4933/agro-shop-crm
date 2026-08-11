-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "initialPaidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SupplierPaymentAllocation" (
    "id" SERIAL NOT NULL,
    "supplierPaymentId" INTEGER NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierPaymentAllocation_supplierPaymentId_idx" ON "SupplierPaymentAllocation"("supplierPaymentId");

-- CreateIndex
CREATE INDEX "SupplierPaymentAllocation_purchaseId_idx" ON "SupplierPaymentAllocation"("purchaseId");

-- AddForeignKey
ALTER TABLE "SupplierPaymentAllocation" ADD CONSTRAINT "SupplierPaymentAllocation_supplierPaymentId_fkey" FOREIGN KEY ("supplierPaymentId") REFERENCES "SupplierPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPaymentAllocation" ADD CONSTRAINT "SupplierPaymentAllocation_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
