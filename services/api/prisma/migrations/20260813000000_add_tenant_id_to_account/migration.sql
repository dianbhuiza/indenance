-- AlterTable
ALTER TABLE "Account" ADD COLUMN "tenantId" TEXT;

-- Backfill existing accounts with the tenant of their owner
UPDATE "Account" a
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE a."userId" = u."id";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Account_userId_tenantId_idx" ON "Account"("userId", "tenantId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;