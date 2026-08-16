-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN "purchasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ShoppingListItem" ALTER COLUMN "quantity" SET DEFAULT 1;

-- CreateIndex
CREATE INDEX "ShoppingList_tenantId_idx" ON "ShoppingList"("tenantId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_shoppingListId_idx" ON "ShoppingListItem"("shoppingListId");