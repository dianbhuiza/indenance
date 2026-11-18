import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { Category } from '../../generated/prisma/client';
import { assertTenant } from '../shared/assert-tenant';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Servicios',
  'Educación',
  'Hogar',
  'Otros',
  'Salario',
  'Freelance',
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string | null): Promise<Category[]> {
    assertTenant(tenantId);
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async seedDefaults(
    tenantId: string,
    db?: Prisma.TransactionClient,
  ): Promise<void> {
    const client: Prisma.TransactionClient = db ?? this.prisma;
    await client.category.createMany({
      data: DEFAULT_CATEGORIES.map((name) => ({ name, tenantId })),
    });
  }
}
