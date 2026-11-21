import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsService } from './budgets.service';

describe('BudgetsService', () => {
  let service: BudgetsService;

  const prismaMock = {
    budget: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
    },
  };

  const txMock = {
    budget: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
    },
  };

  const budgetMock = {
    id: 'budget-1',
    name: 'Comidas',
    amount: 1000,
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: null,
    isRecurring: true,
    interval: 'MONTHLY',
    exceededAt: null,
    tenantId: 'tenant-1',
    categoryId: 'cat-1',
  };

  const now = new Date('2026-08-15T00:00:00.000Z');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a budget for the tenant', async () => {
      prismaMock.category.findFirst.mockResolvedValue({ id: 'cat-1' });
      prismaMock.budget.create.mockResolvedValue(budgetMock);

      const result = await service.create('tenant-1', {
        name: 'Comidas',
        amount: 1000,
        categoryId: 'cat-1',
        startDate: '2026-08-01T00:00:00.000Z',
        isRecurring: true,
        interval: 'MONTHLY',
      });

      expect(prismaMock.budget.create).toHaveBeenCalledWith({
        data: {
          name: 'Comidas',
          amount: 1000,
          startDate: new Date('2026-08-01T00:00:00.000Z'),
          endDate: null,
          isRecurring: true,
          interval: 'MONTHLY',
          categoryId: 'cat-1',
          tenantId: 'tenant-1',
        },
      });
      expect(result).toEqual(budgetMock);
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.create(null, { name: 'Comidas', amount: 1000 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('requires interval when recurring', async () => {
      await expect(
        service.create('tenant-1', {
          name: 'Comidas',
          amount: 1000,
          isRecurring: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when the category is not in the tenant', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', {
          name: 'Comidas',
          amount: 1000,
          categoryId: 'cat-other',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when endDate is not after startDate', async () => {
      await expect(
        service.create('tenant-1', {
          name: 'Comidas',
          amount: 1000,
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-08-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns budgets with computed usage', async () => {
      prismaMock.budget.findMany.mockResolvedValue([budgetMock]);
      prismaMock.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 600 },
      });

      const result = await service.findAll('tenant-1', now);

      expect(prismaMock.budget.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { startDate: 'asc' },
      });
      expect(result[0]).toMatchObject({
        id: 'budget-1',
        spent: 600,
        remaining: 400,
        isExceeded: false,
      });
    });

    it('marks isExceeded when spent is above amount', async () => {
      prismaMock.budget.findMany.mockResolvedValue([budgetMock]);
      prismaMock.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 1500 },
      });

      const result = await service.findAll('tenant-1', now);

      expect(result[0].isExceeded).toBe(true);
      expect(result[0].remaining).toBe(-500);
    });

    it('never counts expenses past the budget endDate', async () => {
      const expired = {
        ...budgetMock,
        isRecurring: false,
        interval: null,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-07-31T23:59:59.999Z'),
      };
      prismaMock.budget.findMany.mockResolvedValue([expired]);
      prismaMock.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 600 },
      });

      const result = await service.findAll('tenant-1', now);

      expect(prismaMock.transaction.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            createdAt: {
              gte: expired.startDate,
              lt: expired.endDate,
            },
          }),
        }),
      );
      expect(result[0].isActive).toBe(false);
    });

    it('reports isActive false for budgets that start in the future', async () => {
      const future = {
        ...budgetMock,
        isRecurring: false,
        interval: null,
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-09-30T00:00:00.000Z'),
      };
      prismaMock.budget.findMany.mockResolvedValue([future]);
      prismaMock.transaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.findAll('tenant-1', now);

      expect(result[0].isActive).toBe(false);
      expect(result[0].spent).toBe(0);
    });
  });

  describe('findOne', () => {
    it('returns a budget with usage', async () => {
      prismaMock.budget.findFirst.mockResolvedValue(budgetMock);
      prismaMock.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 100 },
      });

      const result = await service.findOne('tenant-1', 'budget-1', now);

      expect(prismaMock.budget.findFirst).toHaveBeenCalledWith({
        where: { id: 'budget-1', tenantId: 'tenant-1' },
      });
      expect(result.spent).toBe(100);
    });

    it('throws NotFoundException when the budget is not found', async () => {
      prismaMock.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('tenant-1', 'budget-other', now),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the budget', async () => {
      prismaMock.budget.findFirst.mockResolvedValue(budgetMock);
      prismaMock.budget.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.budget.findFirst.mockResolvedValue({
        ...budgetMock,
        amount: 1200,
      });

      const result = await service.update('tenant-1', 'budget-1', {
        amount: 1200,
      });

      expect(prismaMock.budget.updateMany).toHaveBeenCalledWith({
        where: { id: 'budget-1', tenantId: 'tenant-1' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          amount: 1200,
          isRecurring: true,
          interval: 'MONTHLY',
          exceededAt: null,
        }),
      });
      expect(result.amount).toBe(1200);
    });

    it('throws BadRequestException when setting recurring without interval', async () => {
      prismaMock.budget.findFirst.mockResolvedValue({
        ...budgetMock,
        isRecurring: false,
        interval: null,
      });

      await expect(
        service.update('tenant-1', 'budget-1', { isRecurring: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when interval is set on a non recurring budget', async () => {
      prismaMock.budget.findFirst.mockResolvedValue({
        ...budgetMock,
        isRecurring: false,
        interval: null,
      });

      await expect(
        service.update('tenant-1', 'budget-1', { interval: 'MONTHLY' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reports NotFound when the budget belongs to another tenant', async () => {
      prismaMock.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.update('tenant-1', 'budget-other', { amount: 500 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the budget', async () => {
      prismaMock.budget.findFirst.mockResolvedValue(budgetMock);
      prismaMock.budget.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove('tenant-1', 'budget-1');

      expect(prismaMock.budget.deleteMany).toHaveBeenCalledWith({
        where: { id: 'budget-1', tenantId: 'tenant-1' },
      });
      expect(result).toEqual(budgetMock);
    });
  });

  describe('applyExpense', () => {
    it('marks a budget as exceeded when spent plus amount surpasses the limit', async () => {
       txMock.budget.findMany.mockResolvedValue([budgetMock]);
       txMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1100 } });
       txMock.budget.update.mockResolvedValue(budgetMock);

      await service.applyExpense(
        txMock as never,
        'tenant-1',
        'cat-1',
        200,
        now,
      );

      expect(txMock.budget.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      });
      expect(txMock.budget.update).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
        data: { exceededAt: expect.any(Date) as Date },
      });
    });

    it('does not mark the budget when the amount fits', async () => {
      txMock.budget.findMany.mockResolvedValue([budgetMock]);
      txMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 100 } });

      await service.applyExpense(
        txMock as never,
        'tenant-1',
        'cat-1',
        200,
        now,
      );

      expect(txMock.budget.update).not.toHaveBeenCalled();
    });

    it('clears a stale exceededAt when the budget fits again', async () => {
      txMock.budget.findMany.mockResolvedValue([
        { ...budgetMock, exceededAt: new Date('2026-08-10T00:00:00.000Z') },
      ]);
      txMock.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
      });

      await service.applyExpense(
        txMock as never,
        'tenant-1',
        'cat-1',
        100,
        now,
      );

      expect(txMock.budget.update).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
        data: { exceededAt: null },
      });
    });

    it('ignores budgets of other categories', async () => {
      txMock.budget.findMany.mockResolvedValue([budgetMock]);
      txMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      await service.applyExpense(
        txMock as never,
        'tenant-1',
        'cat-other',
        200,
        now,
      );

      expect(txMock.budget.update).not.toHaveBeenCalled();
    });

    it('applies global budgets regardless of category', async () => {
      txMock.budget.findMany.mockResolvedValue([
        { ...budgetMock, categoryId: null },
      ]);
       txMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1100 } });
      txMock.budget.update.mockResolvedValue(budgetMock);

      await service.applyExpense(
        txMock as never,
        'tenant-1',
        'cat-1',
        200,
        now,
      );

      expect(txMock.budget.update).toHaveBeenCalled();
    });

    it('does nothing when there are no budgets', async () => {
      txMock.budget.findMany.mockResolvedValue([]);

      await service.applyExpense(
        txMock as never,
        'tenant-1',
        'cat-1',
        200,
        now,
      );

      expect(txMock.transaction.aggregate).not.toHaveBeenCalled();
    });
  });
});
