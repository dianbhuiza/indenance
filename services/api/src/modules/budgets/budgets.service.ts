import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Budget, Prisma } from '../../generated/prisma/client';
import { assertTenant } from '../shared/assert-tenant';
import { assertCategoryBelongsToTenant } from '../shared/assert-category';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { budgetPeriod } from './budgets.period';

export interface BudgetWithUsage extends Budget {
  spent: number;
  remaining: number;
  isExceeded: boolean;
  isActive: boolean;
}

interface ActiveBudget {
  id: string;
  amount: number;
  startDate: Date;
  endDate: Date | null;
  interval: Budget['interval'];
  categoryId: string | null;
}

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string | null, dto: CreateBudgetDto): Promise<Budget> {
    assertTenant(tenantId);
    await assertCategoryBelongsToTenant(this.prisma, tenantId, dto.categoryId);
    this.validateDates(dto);

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const isRecurring = dto.isRecurring ?? false;
    if (isRecurring && !dto.interval) {
      throw new BadRequestException(
        'interval is required when isRecurring is true',
      );
    }
    if (!isRecurring && dto.interval) {
      throw new BadRequestException(
        'interval can only be set when isRecurring is true',
      );
    }

    return this.prisma.budget.create({
      data: {
        name: dto.name,
        amount: dto.amount,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isRecurring,
        interval: isRecurring ? dto.interval! : null,
        categoryId: dto.categoryId ?? null,
        tenantId,
      },
    });
  }

  async findAll(
    tenantId: string | null,
    now: Date = new Date(),
  ): Promise<BudgetWithUsage[]> {
    assertTenant(tenantId);
    const budgets = await this.prisma.budget.findMany({
      where: { tenantId },
      orderBy: { startDate: 'asc' },
    });
    return Promise.all(
      budgets.map((budget) => this.withUsage(budget, tenantId, now)),
    );
  }

  async findOne(
    tenantId: string | null,
    id: string,
    now: Date = new Date(),
  ): Promise<BudgetWithUsage> {
    assertTenant(tenantId);
    const budget = await this.findBudget(tenantId, id);
    return this.withUsage(budget, tenantId, now);
  }

  private async findBudget(tenantId: string, id: string): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, tenantId },
    });
    if (!budget) throw new NotFoundException(`Budget with id ${id} not found`);
    return budget;
  }

  async update(
    tenantId: string | null,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    assertTenant(tenantId);
    const existing = await this.findBudget(tenantId, id);
    if (dto.categoryId !== undefined) {
      await assertCategoryBelongsToTenant(
        this.prisma,
        tenantId,
        dto.categoryId,
      );
    }
    this.validateDates(dto, existing);

    const isRecurring = dto.isRecurring ?? existing.isRecurring;
    const interval = isRecurring ? (dto.interval ?? existing.interval) : null;
    if (isRecurring && !interval) {
      throw new BadRequestException(
        'interval is required when isRecurring is true',
      );
    }
    if (!isRecurring && dto.interval !== undefined) {
      throw new BadRequestException(
        'interval can only be set when isRecurring is true',
      );
    }

    const data: Prisma.BudgetUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.startDate !== undefined && {
        startDate: new Date(dto.startDate),
      }),
      ...(dto.endDate !== undefined && {
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }),
      ...(dto.categoryId !== undefined && {
        categoryId: dto.categoryId ?? null,
      }),
      isRecurring,
      interval,
    };

    const windowChanged =
      dto.amount !== undefined ||
      dto.startDate !== undefined ||
      dto.endDate !== undefined ||
      dto.interval !== undefined ||
      dto.isRecurring !== undefined;
    if (windowChanged) data.exceededAt = null;

    const updated = await this.prisma.budget.updateMany({
      where: { id, tenantId },
      data,
    });
    if (updated.count === 0)
      throw new NotFoundException(`Budget with id ${id} not found`);
    return this.findBudget(tenantId, id);
  }

  async remove(tenantId: string | null, id: string): Promise<Budget> {
    assertTenant(tenantId);
    const budget = await this.findBudget(tenantId, id);
    const deleted = await this.prisma.budget.deleteMany({
      where: { id, tenantId },
    });
    if (deleted.count === 0)
      throw new NotFoundException(`Budget with id ${id} not found`);
    return budget;
  }

  /**
   * Marks budgets as exceeded when an expense pushes the current period
   * spend over the budget amount. Runs inside the same DB transaction as
   * the expense so the accounting stays consistent. Does not block.
   */
  async applyExpense(
    tx: Prisma.TransactionClient,
    tenantId: string,
    categoryId: string | null,
    amount: number,
    now: Date = new Date(),
  ): Promise<void> {
    const budgets = await tx.budget.findMany({
      where: {
        tenantId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });
    if (budgets.length === 0) return;

    const active = budgets
      .filter(
        (budget) =>
          budget.categoryId === null || budget.categoryId === categoryId,
      )
      .filter((budget) => this.isActiveInPeriod(budget, now));

    for (const budget of active) {
      const { start, end } = budgetPeriod(
        now,
        budget.startDate,
        budget.interval,
        budget.endDate,
      );
      const spent = await this.spendInPeriod(tx, tenantId, budget, start, end);
      const overLimit = spent + amount > budget.amount;
      if (overLimit && !budget.exceededAt) {
        await tx.budget.update({
          where: { id: budget.id },
          data: { exceededAt: now },
        });
      } else if (!overLimit && budget.exceededAt) {
        await tx.budget.update({
          where: { id: budget.id },
          data: { exceededAt: null },
        });
      }
    }
  }

  private isActiveInPeriod(budget: ActiveBudget, now: Date): boolean {
    const { start, end } = budgetPeriod(
      now,
      budget.startDate,
      budget.interval,
      budget.endDate,
    );
    if (end) return now >= start && now < end;
    return now >= start;
  }

  private async spendInPeriod(
    tx: Prisma.TransactionClient,
    tenantId: string,
    budget: ActiveBudget,
    start: Date,
    end: Date | null,
  ): Promise<number> {
    const aggregate = await tx.transaction.aggregate({
      where: {
        tenantId,
        type: 'EXPENSE',
        createdAt: { gte: start, ...(end ? { lt: end } : {}) },
        ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
      },
      _sum: { amount: true },
    });
    return aggregate._sum.amount ?? 0;
  }

  private async withUsage(
    budget: Budget,
    tenantId: string,
    now: Date,
  ): Promise<BudgetWithUsage> {
    const { start, end } = budgetPeriod(
      now,
      budget.startDate,
      budget.interval,
      budget.endDate,
    );
    const spent = await this.spendInPeriod(
      this.prisma,
      tenantId,
      {
        id: budget.id,
        amount: budget.amount,
        startDate: budget.startDate,
        endDate: budget.endDate,
        interval: budget.interval,
        categoryId: budget.categoryId,
      },
      start,
      end,
    );
    const isExceeded = spent > budget.amount;
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      isExceeded,
      isActive: now >= start && (end ? now < end : true),
      exceededAt: isExceeded ? budget.exceededAt : null,
    };
  }

  private validateDates(
    dto: CreateBudgetDto | UpdateBudgetDto,
    existing?: Budget,
  ): void {
    const start = dto.startDate ? new Date(dto.startDate) : existing?.startDate;
    const end =
      dto.endDate !== undefined
        ? dto.endDate
          ? new Date(dto.endDate)
          : null
        : (existing?.endDate ?? null);
    if (!start || !end) return;
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }
  }
}
