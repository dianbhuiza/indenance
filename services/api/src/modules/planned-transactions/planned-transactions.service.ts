import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Prisma,
  PlannedTransaction,
  PlannedTransactionStatus,
} from '../../generated/prisma/client';
import { assertTenant } from '../shared/assert-tenant';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { CreatePlannedTransactionDto } from './dto/create-planned-transaction.dto';
import { UpdatePlannedTransactionDto } from './dto/update-planned-transaction.dto';

@Injectable()
export class PlannedTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
  ) {}

  private assertRecurring(dto: CreatePlannedTransactionDto): void {
    if (dto.isRecurring && !dto.interval)
      throw new BadRequestException(
        'interval is required when isRecurring is true',
      );
  }

  async create(
    userId: string,
    tenantId: string | null,
    dto: CreatePlannedTransactionDto,
  ): Promise<PlannedTransaction> {
    assertTenant(tenantId);
    this.assertRecurring(dto);
    if (this.txContext.isActive()) {
      return this.createWith(this.txContext.client(), userId, tenantId, dto);
    }
    return this.prisma.$transaction((tx) =>
      this.createWith(tx, userId, tenantId, dto),
    );
  }

  private async createWith(
    tx: Prisma.TransactionClient,
    userId: string,
    tenantId: string,
    dto: CreatePlannedTransactionDto,
  ): Promise<PlannedTransaction> {
    await this.assertAccountBelongsToUser(tx, userId, tenantId, dto.accountId);
    await this.assertCategoryBelongsToTenant(tx, tenantId, dto.categoryId);

    return tx.plannedTransaction.create({
      data: {
        accountId: dto.accountId,
        tenantId,
        amount: dto.amount,
        type: dto.type,
        scheduledAt: dto.scheduledAt ?? new Date(),
        isRecurring: dto.isRecurring ?? false,
        interval: dto.isRecurring ? dto.interval : null,
        categoryId: dto.categoryId ?? null,
      },
    });
  }

  async findAll(
    userId: string,
    tenantId: string | null,
    status?: string,
  ): Promise<PlannedTransaction[]> {
    assertTenant(tenantId);
    const validStatuses = ['ACTIVE', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException(
        `status must be one of ${validStatuses.join(', ')}`,
      );
    }
    return this.prisma.plannedTransaction.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: status && validStatuses.includes(status) ? (status as PlannedTransactionStatus) : undefined,
        account: { userId },
      },
      include: { account: true, category: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransaction> {
    assertTenant(tenantId);
    const plannedTransaction = await this.prisma.plannedTransaction.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        account: { userId },
      },
    });
    if (!plannedTransaction)
      throw new NotFoundException(`PlannedTransaction with id ${id} not found`);
    return plannedTransaction;
  }

  async update(
    userId: string,
    tenantId: string | null,
    id: string,
    dto: UpdatePlannedTransactionDto,
  ): Promise<PlannedTransaction> {
    assertTenant(tenantId);
    const existing = await this.findOne(userId, tenantId, id);
    if (dto.isRecurring === true && !dto.interval)
      throw new BadRequestException(
        'interval is required when isRecurring is true',
      );

    if (this.txContext.isActive()) {
      return this.updateWith(this.txContext.client(), userId, tenantId, {
        id,
        existing,
        dto,
      });
    }
    return this.prisma.$transaction((tx) =>
      this.updateWith(tx, userId, tenantId, { id, existing, dto }),
    );
  }

  private async updateWith(
    tx: Prisma.TransactionClient,
    userId: string,
    tenantId: string,
    args: {
      id: string;
      existing: PlannedTransaction;
      dto: UpdatePlannedTransactionDto;
    },
  ): Promise<PlannedTransaction> {
    const { id, dto } = args;
    if (dto.accountId && dto.accountId !== args.existing.accountId) {
      await this.assertAccountBelongsToUser(
        tx,
        userId,
        tenantId,
        dto.accountId,
      );
    }
    await this.assertCategoryBelongsToTenant(tx, tenantId, dto.categoryId);

    return tx.plannedTransaction.update({
      where: { id },
      data: {
        accountId: dto.accountId,
        amount: dto.amount,
        type: dto.type,
        scheduledAt: dto.scheduledAt,
        isRecurring: dto.isRecurring,
        interval: dto.isRecurring === false ? null : dto.interval,
        categoryId: dto.categoryId,
      },
    });
  }

  async softDelete(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransaction> {
    assertTenant(tenantId);
    await this.findOne(userId, tenantId, id);
    if (this.txContext.isActive()) {
      return this.softDeleteWith(this.txContext.client(), id);
    }
    return this.prisma.$transaction((tx) => this.softDeleteWith(tx, id));
  }

  private async softDeleteWith(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<PlannedTransaction> {
    await tx.plannedTransactionAlert.updateMany({
      where: { plannedTransactionId: id, status: 'PENDING' },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
    return tx.plannedTransaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async remove(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransaction> {
    assertTenant(tenantId);
    await this.findOne(userId, tenantId, id);
    return this.prisma.plannedTransaction.delete({ where: { id } });
  }

  private async assertAccountBelongsToUser(
    tx: Prisma.TransactionClient,
    userId: string,
    tenantId: string,
    accountId: string,
  ): Promise<void> {
    const account = await tx.account.findFirst({
      where: { id: accountId, userId, tenantId },
    });
    if (!account)
      throw new NotFoundException(`Account with id ${accountId} not found`);
  }

  private async assertCategoryBelongsToTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    categoryId?: string,
  ): Promise<void> {
    if (!categoryId) return;
    const category = await tx.category.findFirst({
      where: { id: categoryId, tenantId },
    });
    if (!category)
      throw new NotFoundException(`Category with id ${categoryId} not found`);
  }
}
