import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from '../budgets/budgets.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let txContext: TransactionContextService;

  const txMock = {
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };

  const prismaMock = {
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(txMock),
    ),
    transaction: {
      findMany: jest.fn(),
    },
  };

  const budgetsServiceMock = {
    applyExpense: jest.fn(),
  };

  const accountMock = {
    id: 'account-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    balance: 100,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        TransactionContextService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BudgetsService, useValue: budgetsServiceMock },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    txContext = module.get<TransactionContextService>(
      TransactionContextService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('record', () => {
    it('creates an income transaction and increments the balance', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.transaction.create.mockResolvedValue({
        id: 'tx-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        amount: 500,
        type: 'INCOME',
      });

      const result = await service.record('user-1', 'tenant-1', {
        accountId: 'account-1',
        amount: 500,
        type: 'INCOME',
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(txMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'account-1', userId: 'user-1', tenantId: 'tenant-1' },
      });
      expect(txMock.transaction.create).toHaveBeenCalledWith({
        data: {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          amount: 500,
          type: 'INCOME',
          categoryId: null,
        },
      });
      expect(txMock.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: { balance: { increment: 500 } },
      });
      expect(result.type).toBe('INCOME');
    });

    it('decrements the balance for an expense', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.transaction.create.mockResolvedValue({
        id: 'tx-2',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        amount: 200,
        type: 'EXPENSE',
      });

      await service.record('user-1', 'tenant-1', {
        accountId: 'account-1',
        amount: 200,
        type: 'EXPENSE',
      });

      expect(txMock.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: { balance: { increment: -200 } },
      });
    });

    it('applies budget usage for an expense', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.transaction.create.mockResolvedValue({
        id: 'tx-2',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        amount: 200,
        type: 'EXPENSE',
      });
      budgetsServiceMock.applyExpense.mockResolvedValue(undefined);

      await service.record('user-1', 'tenant-1', {
        accountId: 'account-1',
        amount: 200,
        type: 'EXPENSE',
        categoryId: 'cat-1',
      });

      expect(budgetsServiceMock.applyExpense).toHaveBeenCalledWith(
        txMock,
        'tenant-1',
        'cat-1',
        200,
      );
    });

    it('does not apply budget usage for an income', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.transaction.create.mockResolvedValue({
        id: 'tx-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        amount: 500,
        type: 'INCOME',
      });

      await service.record('user-1', 'tenant-1', {
        accountId: 'account-1',
        amount: 500,
        type: 'INCOME',
      });

      expect(budgetsServiceMock.applyExpense).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the account is not owned by the user', async () => {
      txMock.account.findFirst.mockResolvedValue(null);

      await expect(
        service.record('user-1', 'tenant-1', {
          accountId: 'account-other',
          amount: 100,
          type: 'EXPENSE',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.record('user-1', null, {
          accountId: 'account-1',
          amount: 100,
          type: 'EXPENSE',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('reuses the ambient transaction client when called inside a context', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.transaction.create.mockResolvedValue({
        id: 'tx-3',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        amount: 100,
        type: 'INCOME',
      });

      await txContext.run(() =>
        service.record('user-1', 'tenant-1', {
          accountId: 'account-1',
          amount: 100,
          type: 'INCOME',
        }),
      );

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(txMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'account-1', userId: 'user-1', tenantId: 'tenant-1' },
      });
    });
  });

  describe('findAll', () => {
    it('lists transactions for the user accounts', async () => {
      const transactionList = [{ id: 'tx-1' }];
      prismaMock.transaction.findMany.mockResolvedValue(transactionList);

      const result = await service.findAll('user-1', 'tenant-1');

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', account: { userId: 'user-1' } },
        include: { account: true, category: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(transactionList);
    });
  });
});
