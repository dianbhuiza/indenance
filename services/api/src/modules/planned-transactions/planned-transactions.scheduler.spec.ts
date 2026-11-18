import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AppConfig } from '../../config/app.config';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { PlannedTransactionAlertsService } from './planned-transaction-alerts.service';
import { PlannedTransactionsScheduler } from './planned-transactions.scheduler';
import { advanceScheduledAt } from './planned-transactions.interval';

describe('PlannedTransactionsScheduler', () => {
  let scheduler: PlannedTransactionsScheduler;

  const txMock = {
    plannedTransaction: {
      updateMany: jest.fn(),
    },
    plannedTransactionAlert: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    loanInstallment: {
      findFirst: jest.fn(),
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

  const alertsServiceMock = {
    executeAlert: jest.fn(),
  };

  const configMock = {
    plannedTxCron: '0 * * * *',
  } as unknown as AppConfig;

  const schedulerRegistryMock = {
    addCronJob: jest.fn(),
  };

  const duePlan = (overrides: Record<string, unknown> = {}) => ({
    id: 'pt-1',
    tenantId: 'tenant-1',
    accountId: 'account-1',
    amount: 500,
    type: 'EXPENSE',
    isRecurring: true,
    interval: 'MONTHLY',
    scheduledAt: new Date('2026-08-01T10:00:00.000Z'),
    categoryId: null,
    deletedAt: null,
    status: 'ACTIVE',
    requiresApproval: true,
    occurrences: null,
    completedOccurrences: 0,
    loanId: null,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-01T12:00:00.000Z'));

    txMock.plannedTransactionAlert.findUnique.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannedTransactionsScheduler,
        TransactionContextService,
        { provide: SchedulerRegistry, useValue: schedulerRegistryMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: AppConfig, useValue: configMock },
        {
          provide: PlannedTransactionAlertsService,
          useValue: alertsServiceMock,
        },
      ],
    }).compile();

    scheduler = module.get<PlannedTransactionsScheduler>(
      PlannedTransactionsScheduler,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('processDue', () => {
    it('raises an alert for a due recurring plan and advances its schedule', async () => {
      const due = duePlan();
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-1' });

      await scheduler.processDue();

      let expectedNext = due.scheduledAt;
      while (expectedNext.getTime() <= Date.now()) {
        expectedNext = advanceScheduledAt(expectedNext, 'MONTHLY');
      }

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
          scheduledAt: expectedNext,
        },
      });
      expect(expectedNext.getTime()).toBeGreaterThan(Date.now());
      expect(txMock.plannedTransactionAlert.create).toHaveBeenCalledWith({
        data: {
          plannedTransactionId: 'pt-1',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          amount: 500,
          type: 'EXPENSE',
          categoryId: null,
          dueAt: due.scheduledAt,
          status: 'PENDING',
          resolvedAt: null,
          loanInstallmentId: null,
        },
      });
      expect(alertsServiceMock.executeAlert).not.toHaveBeenCalled();
    });

    it('executes the alert right away when approval is not required', async () => {
      const due = duePlan({ requiresApproval: false });
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-1' });
      alertsServiceMock.executeAlert.mockResolvedValue({ id: 'al-1' });

      await scheduler.processDue();

      expect(txMock.plannedTransactionAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'APPROVED',
          resolvedAt: expect.any(Date) as Date,
        }) as object,
      });
      expect(alertsServiceMock.executeAlert).toHaveBeenCalledWith(
        txMock,
        'al-1',
      );
    });

    it('closes the series instead of raising when the occurrence limit is reached', async () => {
      const due = duePlan({ occurrences: 3, completedOccurrences: 3 });
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });

      await scheduler.processDue();

      expect(txMock.plannedTransactionAlert.create).not.toHaveBeenCalled();
      expect(txMock.plannedTransaction.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'pt-1',
          scheduledAt: due.scheduledAt,
          deletedAt: null,
          status: 'ACTIVE',
        },
        data: { status: 'COMPLETED' },
      });
      expect(txMock.plannedTransactionAlert.updateMany).toHaveBeenCalledWith({
        where: { plannedTransactionId: 'pt-1', status: 'PENDING' },
        data: { status: 'REJECTED', resolvedAt: expect.any(Date) as Date },
      });
    });

    it('links the alert to the oldest unpaid installment of the loan', async () => {
      const due = duePlan({ loanId: 'loan-1' });
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });
      txMock.loanInstallment.findFirst.mockResolvedValue({ id: 'li-2' });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-1' });

      await scheduler.processDue();

      expect(txMock.loanInstallment.findFirst).toHaveBeenCalledWith({
        where: {
          loanId: 'loan-1',
          status: 'PENDING',
          dueAt: { lte: due.scheduledAt },
        },
        orderBy: { number: 'asc' },
      });
      expect(txMock.plannedTransactionAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ loanInstallmentId: 'li-2' }) as object,
      });
    });

    it('marks a one-time plan as completed and raises its alert', async () => {
      const due = duePlan({
        id: 'pt-2',
        amount: 300,
        isRecurring: false,
        interval: null,
      });
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
      const due = duePlan({
        id: 'pt-3',
        isRecurring: false,
        interval: null,
      });
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 0 });

      await scheduler.processDue();

      expect(txMock.plannedTransactionAlert.create).not.toHaveBeenCalled();
    });

    it('skips a due date that already has an alert', async () => {
      const due = duePlan();
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransactionAlert.findUnique.mockResolvedValue({
        id: 'al-existing',
      });

      await scheduler.processDue();

      expect(txMock.plannedTransaction.updateMany).not.toHaveBeenCalled();
      expect(txMock.plannedTransactionAlert.create).not.toHaveBeenCalled();
    });

    it('does nothing when there are no due plans', async () => {
      prismaMock.plannedTransaction.findMany.mockResolvedValue([]);

      await scheduler.processDue();

      expect(txMock.plannedTransaction.updateMany).not.toHaveBeenCalled();
      expect(txMock.plannedTransactionAlert.create).not.toHaveBeenCalled();
    });

    it('keeps processing the remaining plans when one fails', async () => {
      const due = [
        duePlan({
          id: 'pt-bad',
          amount: 100,
          isRecurring: false,
          interval: null,
        }),
        duePlan({
          id: 'pt-good',
          amount: 200,
          isRecurring: false,
          interval: null,
          scheduledAt: new Date('2026-08-02T10:00:00.000Z'),
        }),
      ];
      prismaMock.plannedTransaction.findMany.mockResolvedValue(due);
      txMock.plannedTransaction.updateMany
        .mockRejectedValueOnce(new Error('db down'))
        .mockResolvedValueOnce({ count: 1 });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-1' });

      await scheduler.processDue();

      expect(txMock.plannedTransaction.updateMany).toHaveBeenCalledTimes(2);
      expect(txMock.plannedTransactionAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          plannedTransactionId: 'pt-good',
        }) as object,
      });
    });

    it('reuses the ambient transaction per plan', async () => {
      const due = duePlan({
        id: 'pt-4',
        isRecurring: false,
        interval: null,
      });
      prismaMock.plannedTransaction.findMany.mockResolvedValue([due]);
      txMock.plannedTransaction.updateMany.mockResolvedValue({ count: 1 });
      txMock.plannedTransactionAlert.create.mockResolvedValue({ id: 'al-4' });

      await scheduler.processDue();

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
