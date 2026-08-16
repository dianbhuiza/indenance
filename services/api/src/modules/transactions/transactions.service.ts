import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Transaction } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
  ) {}

  private assertTenant(tenantId: string | null): asserts tenantId is string {
    if (!tenantId)
      throw new ForbiddenException('User does not belong to a tenant');
  }

  async record(
    userId: string,
    tenantId: string | null,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    this.assertTenant(tenantId);
    if (this.txContext.isActive()) {
      return this.recordWith(this.txContext.client(), userId, tenantId, dto);
    }
    return this.prisma.$transaction((tx) =>
      this.recordWith(tx, userId, tenantId, dto),
    );
  }

  private async recordWith(
    tx: Prisma.TransactionClient,
    userId: string,
    tenantId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    const account = await tx.account.findFirst({
      where: { id: dto.accountId, userId, tenantId },
    });
    if (!account)
      throw new NotFoundException(`Account with id ${dto.accountId} not found`);

    const transaction = await tx.transaction.create({
      data: {
        accountId: dto.accountId,
        tenantId,
        amount: dto.amount,
        type: dto.type,
        categoryId: dto.categoryId ?? null,
      },
    });

    await tx.account.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: dto.type === 'INCOME' ? dto.amount : -dto.amount,
        },
      },
    });

    return transaction;
  }

  async findAll(
    userId: string,
    tenantId: string | null,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { tenantId: tenantId ?? undefined, account: { userId } },
      include: { account: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
