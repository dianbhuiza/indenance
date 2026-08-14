import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertTenant(tenantId: string | null): asserts tenantId is string {
    if (!tenantId)
      throw new ForbiddenException('User does not belong to a tenant');
  }

  async create(
    userId: string,
    tenantId: string | null,
    dto: CreateAccountDto,
  ): Promise<Account> {
    this.assertTenant(tenantId);
    return this.prisma.account.create({
      data: {
        userId,
        tenantId,
        name: dto.name,
        currency: dto.currency,
        balance: dto.balance ?? 0,
      },
    });
  }

  async findAll(userId: string, tenantId: string | null): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId, tenantId: tenantId ?? undefined },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId, tenantId: tenantId ?? undefined },
    });
    if (!account)
      throw new NotFoundException(`Account with id ${id} not found`);
    return account;
  }

  async update(
    userId: string,
    tenantId: string | null,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<Account> {
    await this.findOne(userId, tenantId, id);
    return this.prisma.account.update({ where: { id }, data: dto });
  }

  async remove(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<Account> {
    await this.findOne(userId, tenantId, id);
    return this.prisma.account.delete({ where: { id } });
  }
}
