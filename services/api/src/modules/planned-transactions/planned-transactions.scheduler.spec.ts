import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AppConfig } from '../../config/app.config';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { PlannedTransactionsScheduler } from './planned-transactions.scheduler';

describe('PlannedTransactionsScheduler', () => {
  let scheduler: PlannedTransactionsScheduler;

  const txMock = {
    plannedTransaction: {
      updateMany: jest.fn(),
    },
    plannedTransactionAlert: {
      create: jest.fn(),
    },
  };

  const prismaMock = {
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(txMock),
    ),
    plannedTransaction: {
      findMany: jest.fn(),
    },
  };

  const configMock = {
    plannedTxCron: '0 * * * *',
  } as unknown as AppConfig;

  const schedulerRegistryMock = {
    addCronJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannedTransactionsScheduler,
        TransactionContextService,
        { provide: SchedulerRegistry, useValue: schedulerRegistryMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: AppConfig, useValue: configMock },
      ],
    }).compile();

    scheduler = module.get<PlannedTransactionsScheduler>(
      PlannedTransactionsScheduler,
    );
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('processDue', () => {
    it('raises an alert for a due recurring plan and advances its schedule', async () => {
      const due = {
        id: 'pt-1',
        tenantId: 'tenant-1',
        accountId: 'account-1',
        amount: 500,
        type: 'EXPENSE',
        isRecurring: true,
        interval: 'MONTHLY',
        scheduledAt: new Date('2026-08-01T10:00:00.000Z'),
        categoryId: null,
      };
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-1' });

      await scheduler.processDue();

      expect(prismaMock.plannedTransaction.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          scheduledAt: { lte: expect.any(Date) as Date },
        },
        take: 100,
        orderBy: { scheduledAt: 'asc' },
      });
      expect(txMock.plannedTransaction.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'pt-1',
          scheduledAt: due.scheduledAt,
          deletedAt: null,
          status: 'ACTIVE',
        },
        data: {
          scheduledAt: new Date('2026-09-01T10:00:00.000Z'),
        },
      });
      expect(txMock.plannedTransactionAlert.create).toHaveBeenCalledWith({
        data: {
          plannedTransactionId: 'pt-1',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          amount: 500,
          type: 'EXPENSE',
          categoryId: null,
          dueAt: due.scheduledAt,
        },
      });
    });

    it('marks a one-time plan as completed and raises its alert', async () => {
      const due = {
        id: 'pt-2',
        tenantId: 'tenant-1',
        accountId: 'account-1',
        amount: 300,
        type: 'EXPENSE',
        isRecurring: false,
        interval: null,
        scheduledAt: new Date('2026-08-01T10:00:00.000Z'),
        categoryId: null,
      };
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-2' });

      await scheduler.processDue();

      expect(txMock.plannedTransaction.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'pt-2',
          scheduledAt: due.scheduledAt,
          deletedAt: null,
          status: 'ACTIVE',
        },
        data: { status: 'COMPLETED' },
      });
      expect(txMock.plannedTransactionAlert.create).toHaveBeenCalled();
    });

    it('skips plans already claimed by another tick or instance', async () => {
      const due = {
        id: 'pt-3',
        tenantId: 'tenant-1',
        accountId: 'account-1',
        amount: 300,
        type: 'EXPENSE',
        isRecurring: false,
        interval: null,
        scheduledAt: new Date('2026-08-01T10:00:00.000Z'),
        categoryId: null,
      };
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 0 });

      await scheduler.processDue();

      expect(txMock.plannedTransactionAlert.create).not.toHaveBeenCalled();
    });

    it('does nothing when there are no due plans', async () => {
      prismaMock.plannedTransaction.findMany.mockResolvedValue([]);

      await scheduler.processDue();

      expect(txMock.plannedTransaction.updateMany).not.toHaveBeenCalled();
      expect(txMock.plannedTransactionAlert.create).not.toHaveBeenCalled();
    });

    it('reuses the ambient transaction per plan', async () => {
      const due = {
        id: 'pt-4',
        tenantId: 'tenant-1',
        accountId: 'account-1',
        amount: 300,
        type: 'EXPENSE',
        isRecurring: false,
        interval: null,
        scheduledAt: new Date('2026-08-01T10:00:00.000Z'),
        categoryId: null,
      };
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-4' });

      await scheduler.processDue();

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
