-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

-- DropIndex
DROP INDEX "PlannedTransactionAlert_plannedTransactionId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "PlannedTransactionAlert_plannedTransactionId_dueAt_key" ON "PlannedTransactionAlert"("plannedTransactionId", "dueAt");
