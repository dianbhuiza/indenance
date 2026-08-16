-- CreateEnum
CREATE TYPE "PlannedTransactionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PlannedTransactionAlertStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "PlannedTransaction" ADD COLUMN "status" "PlannedTransactionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "PlannedTransactionAlert" (
    "id" TEXT NOT NULL,
    "plannedTransactionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "categoryId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "PlannedTransactionAlertStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PlannedTransactionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlannedTransactionAlert_transactionId_key" ON "PlannedTransactionAlert"("transactionId");

-- CreateIndex
CREATE INDEX "PlannedTransactionAlert_status_dueAt_idx" ON "PlannedTransactionAlert"("status", "dueAt");

-- CreateIndex
CREATE INDEX "PlannedTransactionAlert_plannedTransactionId_idx" ON "PlannedTransactionAlert"("plannedTransactionId");

-- AddForeignKey
ALTER TABLE "PlannedTransactionAlert" ADD CONSTRAINT "PlannedTransactionAlert_plannedTransactionId_fkey" FOREIGN KEY ("plannedTransactionId") REFERENCES "PlannedTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransactionAlert" ADD CONSTRAINT "PlannedTransactionAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransactionAlert" ADD CONSTRAINT "PlannedTransactionAlert_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransactionAlert" ADD CONSTRAINT "PlannedTransactionAlert_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransactionAlert" ADD CONSTRAINT "PlannedTransactionAlert_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;