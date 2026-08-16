import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Budget, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { budgetPeriod } from './budgets.period';

export interface BudgetWithUsage extends Budget {
  spent: number;
  remaining: number;
  isExceeded: boolean;
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

  private assertTenant(tenantId: string | null): asserts tenantId is string {
    if (!tenantId)
      throw new ForbiddenException('User does not belong to a tenant');
  }

  async create(tenantId: string | null, dto: CreateBudgetDto): Promise<Budget> {
    this.assertTenant(tenantId);
    await this.assertCategoryBelongsToTenant(tenantId, dto.categoryId);
    this.validateDates(dto);

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const isRecurring = dto.isRecurring ?? false;
    if (isRecurring && !dto.interval) {
      throw new BadRequestException(
        'interval is required when isRecurring is true',
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
    const budgets = await this.prisma.budget.findMany({
      where: { tenantId: tenantId ?? undefined },
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
    const budget = await this.findBudget(tenantId, id);
    return this.withUsage(budget, tenantId, now);
  }

  private async findBudget(
    tenantId: string | null,
    id: string,
  ): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, tenantId: tenantId ?? undefined },
    });
    if (!budget) throw new NotFoundException(`Budget with id ${id} not found`);
    return budget;
  }

  async update(
    tenantId: string | null,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    await this.findBudget(tenantId, id);
    if (dto.categoryId !== undefined) {
      await this.assertCategoryBelongsToTenant(tenantId, dto.categoryId);
    }
    this.validateDates(dto);

    const data: Prisma.BudgetUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.startDate !== undefined && {
        startDate: new Date(dto.startDate),
      }),
      ...(dto.endDate !== undefined && {
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }),
      ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
      ...(dto.categoryId !== undefined && {
        categoryId: dto.categoryId ?? null,
      }),
    };

    if (dto.isRecurring === true && dto.interval === undefined) {
      const current = await this.prisma.budget.findUnique({ where: { id } });
      if (!current?.interval) {
        throw new BadRequestException(
          'interval is required when isRecurring is true',
        );
      }
    }
    if (dto.interval !== undefined) {
      data.interval = dto.interval;
    }
    if (dto.isRecurring === false) {
      data.interval = null;
    }

    return this.prisma.budget.update({ where: { id }, data });
  }

  async remove(tenantId: string | null, id: string): Promise<Budget> {
    await this.findBudget(tenantId, id);
    return this.prisma.budget.delete({ where: { id } });
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
      );
      const spent = await this.spendInPeriod(tx, tenantId, budget, start, end);
      if (spent + amount > budget.amount) {
        await tx.budget.update({
          where: { id: budget.id },
          data: { exceededAt: budget.exceededAt ?? now },
        });
      }
    }
  }

  private isActiveInPeriod(budget: ActiveBudget, now: Date): boolean {
    const { start, end } = budgetPeriod(now, budget.startDate, budget.interval);
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
    tenantId: string | null,
    now: Date,
  ): Promise<BudgetWithUsage> {
    const { start, end } = budgetPeriod(now, budget.startDate, budget.interval);
    const spent = await this.spendInPeriod(
      this.prisma,
      tenantId ?? '',
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
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      isExceeded: spent > budget.amount,
    };
  }

  private validateDates(dto: CreateBudgetDto | UpdateBudgetDto): void {
    if (!dto.startDate || !dto.endDate) return;
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be after startDate');
    }
  }

  private async assertCategoryBelongsToTenant(
    tenantId: string | null,
    categoryId?: string,
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId: tenantId ?? undefined },
    });
    if (!category)
      throw new NotFoundException(`Category with id ${categoryId} not found`);
  }
}
