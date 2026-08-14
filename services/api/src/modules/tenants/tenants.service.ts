import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tenant } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: string, dto: CreateTenantDto): Promise<Tenant> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (user?.tenantId)
      throw new ConflictException('User already belongs to a tenant');

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: dto.name } });
      await tx.user.update({
        where: { id: userId },
        data: { tenantId: tenant.id },
      });
      return tenant;
    });
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
