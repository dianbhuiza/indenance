import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account } from '../../generated/prisma/client';
import { assertTenant } from '../shared/assert-tenant';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    tenantId: string | null,
    dto: CreateAccountDto,
  ): Promise<Account> {
    assertTenant(tenantId);
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
    assertTenant(tenantId);
    return this.prisma.account.findMany({
      where: { userId, tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<Account> {
    assertTenant(tenantId);
    const account = await this.prisma.account.findFirst({
      where: { id, userId, tenantId },
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
    assertTenant(tenantId);
    const updated = await this.prisma.account.updateMany({
      where: { id, userId, tenantId },
      data: dto,
    });
    if (updated.count === 0)
      throw new NotFoundException(`Account with id ${id} not found`);
    return this.findOne(userId, tenantId, id);
  }

  async remove(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<Account> {
    assertTenant(tenantId);
    const account = await this.findOne(userId, tenantId, id);

    const [transactions, plannedTransactions] = await Promise.all([
      this.prisma.transaction.count({ where: { accountId: id } }),
      this.prisma.plannedTransaction.count({ where: { accountId: id } }),
    ]);
    if (transactions > 0 || plannedTransactions > 0) {
      throw new ConflictException(
        'Cannot delete an account with transactions or planned transactions',
      );
    }

    const deleted = await this.prisma.account.deleteMany({
      where: { id, userId, tenantId },
    });
    if (deleted.count === 0)
      throw new NotFoundException(`Account with id ${id} not found`);
    return account;
  }
}
