import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tenant } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async createForUser(
    userId: string,
    dto: CreateTenantDto,
    db?: Prisma.TransactionClient,
  ): Promise<Tenant> {
    if (db) return this.createWith(userId, dto, db);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (user?.tenantId)
      throw new ConflictException('User already belongs to a tenant');

    return this.prisma.$transaction((tx) => this.createWith(userId, dto, tx));
  }

  private async createWith(
    userId: string,
    dto: CreateTenantDto,
    tx: Prisma.TransactionClient,
  ): Promise<Tenant> {
    const tenant = await tx.tenant.create({ data: { name: dto.name } });
    const claimed = await tx.user.updateMany({
      where: { id: userId, tenantId: null },
      data: { tenantId: tenant.id },
    });
    if (claimed.count === 0)
      throw new ConflictException('User already belongs to a tenant');
    await this.categoriesService.seedDefaults(tenant.id, tx);
    return tenant;
  }

  async findByUserId(userId: string): Promise<Tenant | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenant: true },
    });
    return user?.tenant ?? null;
  }

  async update(
    tenantId: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant)
      throw new NotFoundException(`Tenant with id ${tenantId} not found`);
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateTenantDto,
    });
  }
}
