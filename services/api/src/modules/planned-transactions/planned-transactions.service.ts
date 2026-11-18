import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Interval,
  Prisma,
  PlannedTransaction,
  PlannedTransactionStatus,
} from '../../generated/prisma/client';
import { assertTenant } from '../shared/assert-tenant';
import { assertCategoryBelongsToTenant } from '../shared/assert-category';
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
    if (!dto.isRecurring && dto.interval)
      throw new BadRequestException(
        'interval can only be set when isRecurring is true',
      );
    if (dto.occurrences !== undefined && !dto.isRecurring)
      throw new BadRequestException(
        'occurrences can only be set when isRecurring is true',
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
    await assertCategoryBelongsToTenant(tx, tenantId, dto.categoryId);

    return tx.plannedTransaction.create({
      data: {
        accountId: dto.accountId,
        tenantId,
        amount: dto.amount,
        type: dto.type,
        scheduledAt: dto.scheduledAt ?? new Date(),
        isRecurring: dto.isRecurring ?? false,
        interval: dto.isRecurring ? dto.interval : null,
        requiresApproval: dto.requiresApproval ?? true,
        occurrences: dto.isRecurring ? (dto.occurrences ?? null) : null,
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
        status:
          status && validStatuses.includes(status)
            ? (status as PlannedTransactionStatus)
            : undefined,
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
    if (existing.status !== 'ACTIVE')
      throw new BadRequestException(
        'Cannot modify a COMPLETED planned transaction',
      );

    const isRecurring = dto.isRecurring ?? existing.isRecurring;
    const interval = isRecurring ? (dto.interval ?? existing.interval) : null;
    if (isRecurring && !interval)
      throw new BadRequestException(
        'interval is required when isRecurring is true',
      );
    if (!isRecurring && dto.interval !== undefined)
      throw new BadRequestException(
        'interval can only be set when isRecurring is true',
      );
    if (!isRecurring && dto.occurrences !== undefined)
      throw new BadRequestException(
        'occurrences can only be set when isRecurring is true',
      );

    const requiresApproval = dto.requiresApproval ?? existing.requiresApproval;
    const occurrences = isRecurring
      ? dto.occurrences !== undefined
        ? dto.occurrences
        : existing.occurrences
      : null;
    if (occurrences !== null && occurrences < existing.completedOccurrences)
      throw new BadRequestException(
        `occurrences cannot be lower than the number of completed occurrences (${existing.completedOccurrences})`,
      );

    const args = {
      id,
      existing,
      dto,
      isRecurring,
      interval,
      requiresApproval,
      occurrences,
    };
    if (this.txContext.isActive()) {
      return this.updateWith(this.txContext.client(), userId, tenantId, args);
    }
    return this.prisma.$transaction((tx) =>
      this.updateWith(tx, userId, tenantId, args),
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
      isRecurring: boolean;
      interval: Interval | null;
      requiresApproval: boolean;
      occurrences: number | null;
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
    await assertCategoryBelongsToTenant(tx, tenantId, dto.categoryId);

    const updated = await tx.plannedTransaction.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        account: { userId },
      },
      data: {
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.scheduledAt !== undefined && { scheduledAt: dto.scheduledAt }),
        ...(dto.categoryId !== undefined && {
          categoryId: dto.categoryId ?? null,
        }),
        isRecurring: args.isRecurring,
        interval: args.interval,
        requiresApproval: args.requiresApproval,
        occurrences: args.occurrences,
      },
    });
    if (updated.count === 0)
      throw new NotFoundException(`PlannedTransaction with id ${id} not found`);

    return tx.plannedTransaction.findUniqueOrThrow({ where: { id } });
  }

  async softDelete(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransaction> {
    assertTenant(tenantId);
    await this.findOne(userId, tenantId, id);
    if (this.txContext.isActive()) {
      return this.softDeleteWith(this.txContext.client(), userId, tenantId, id);
    }
    return this.prisma.$transaction((tx) =>
      this.softDeleteWith(tx, userId, tenantId, id),
    );
  }

  private async softDeleteWith(
    tx: Prisma.TransactionClient,
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<PlannedTransaction> {
    await tx.plannedTransactionAlert.updateMany({
      where: { plannedTransactionId: id, status: 'PENDING' },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
    const updated = await tx.plannedTransaction.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        account: { userId },
      },
      data: { deletedAt: new Date() },
    });
    if (updated.count === 0)
      throw new NotFoundException(`PlannedTransaction with id ${id} not found`);
    return tx.plannedTransaction.findUniqueOrThrow({ where: { id } });
  }

  async remove(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransaction> {
    assertTenant(tenantId);
    const planned = await this.findOne(userId, tenantId, id);
    const deleted = await this.prisma.plannedTransaction.deleteMany({
      where: { id, tenantId, account: { userId } },
    });
    if (deleted.count === 0)
      throw new NotFoundException(`PlannedTransaction with id ${id} not found`);
    return planned;
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
}
