import { NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

export type CategoryDb = Prisma.TransactionClient | PrismaService;

/**
 * Verifies the category exists inside the given tenant. Pass the ambient
 * transaction client when running inside one so the check shares the
 * transaction's snapshot and rollback scope.
 */
export async function assertCategoryBelongsToTenant(
  db: CategoryDb,
  tenantId: string,
  categoryId?: string | null,
): Promise<void> {
  if (!categoryId) return;
  const client: Prisma.TransactionClient = db;
  const category = await client.category.findFirst({
    where: { id: categoryId, tenantId },
  });
  if (!category)
    throw new NotFoundException(`Category with id ${categoryId} not found`);
}
