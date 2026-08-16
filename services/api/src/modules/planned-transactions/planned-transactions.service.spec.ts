import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { PlannedTransactionsService } from './planned-transactions.service';

describe('PlannedTransactionsService', () => {
  let service: PlannedTransactionsService;
  let txContext: TransactionContextService;

  const txMock = {
    account: {
      findFirst: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    plannedTransaction: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    plannedTransactionAlert: {
      updateMany: jest.fn(),
    },
  };

  const prismaMock = {
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(txMock),
    ),
    plannedTransaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    plannedTransactionAlert: {
      updateMany: jest.fn(),
    },
  };

  const accountMock = {
    id: 'account-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    balance: 100,
  };

  const plannedTransactionMock = {
    id: 'pt-1',
    accountId: 'account-1',
    tenantId: 'tenant-1',
    amount: 500,
    type: 'EXPENSE',
    isRecurring: true,
    interval: 'MONTHLY',
    scheduledAt: new Date('2026-08-20T15:00:00.000Z'),
    categoryId: null,
    deletedAt: null,
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannedTransactionsService,
        TransactionContextService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PlannedTransactionsService>(
      PlannedTransactionsService,
    );
    txContext = module.get<TransactionContextService>(
      TransactionContextService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      accountId: 'account-1',
      amount: 500,
      type: 'EXPENSE' as const,
      scheduledAt: new Date('2026-08-20T15:00:00.000Z'),
      isRecurring: true,
      interval: 'MONTHLY' as const,
    };

    it('creates a planned transaction scoped to the tenant', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.category.findFirst.mockResolvedValue(null);
      txMock.plannedTransaction.create.mockResolvedValue(
        plannedTransactionMock,
      );

      const result = await service.create('user-1', 'tenant-1', dto);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(txMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'account-1', userId: 'user-1', tenantId: 'tenant-1' },
      });
      expect(txMock.plannedTransaction.create).toHaveBeenCalledWith({
        data: {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          amount: 500,
          type: 'EXPENSE',
          scheduledAt: dto.scheduledAt,
          isRecurring: true,
          interval: 'MONTHLY',
          categoryId: null,
        },
      });
      expect(result).toEqual(plannedTransactionMock);
    });

    it('validates that the category belongs to the tenant', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.category.findFirst.mockResolvedValue({
        id: 'category-1',
        tenantId: 'tenant-1',
      });
      txMock.plannedTransaction.create.mockResolvedValue(
        plannedTransactionMock,
      );

      await service.create('user-1', 'tenant-1', {
        ...dto,
        categoryId: 'category-1',
      });

      expect(txMock.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'category-1', tenantId: 'tenant-1' },
      });
    });

    it('throws NotFoundException when the account is not owned by the user', async () => {
      txMock.account.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'tenant-1', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the category belongs to another tenant', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'tenant-1', {
          ...dto,
          categoryId: 'category-other',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects users without a tenant', async () => {
      await expect(service.create('user-1', null, dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('requires an interval when isRecurring is true', async () => {
      await expect(
        service.create('user-1', 'tenant-1', {
          accountId: 'account-1',
          amount: 500,
          type: 'EXPENSE',
          isRecurring: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reuses the ambient transaction client when called inside a context', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.plannedTransaction.create.mockResolvedValue(
        plannedTransactionMock,
      );

      await txContext.run(() => service.create('user-1', 'tenant-1', dto));

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('lists only non-deleted planned transactions for the user accounts', async () => {
      prismaMock.plannedTransaction.findMany.mockResolvedValue([
        plannedTransactionMock,
      ]);

      const result = await service.findAll('user-1', 'tenant-1');

      expect(prismaMock.plannedTransaction.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          deletedAt: null,
          status: undefined,
          account: { userId: 'user-1' },
        },
        include: { account: true, category: true },
        orderBy: { scheduledAt: 'asc' },
      });
      expect(result).toEqual([plannedTransactionMock]);
    });

    it('filters by status when provided', async () => {
      prismaMock.plannedTransaction.findMany.mockResolvedValue([
        plannedTransactionMock,
      ]);

      const result = await service.findAll('user-1', 'tenant-1', 'COMPLETED');

      expect(prismaMock.plannedTransaction.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          deletedAt: null,
          status: 'COMPLETED',
          account: { userId: 'user-1' },
        },
        include: { account: true, category: true },
        orderBy: { scheduledAt: 'asc' },
      });
      expect(result).toEqual([plannedTransactionMock]);
    });

    it('rejects an invalid status filter', async () => {
      await expect(
        service.findAll('user-1', 'tenant-1', 'INVALID'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns a planned transaction owned by the user in the tenant', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(
        plannedTransactionMock,
      );

      const result = await service.findOne('user-1', 'tenant-1', 'pt-1');

      expect(prismaMock.plannedTransaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'pt-1',
          tenantId: 'tenant-1',
          deletedAt: null,
          status: 'ACTIVE',
          account: { userId: 'user-1' },
        },
      });
      expect(result).toEqual(plannedTransactionMock);
    });

    it('throws NotFoundException for a completed plan', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'tenant-1', 'pt-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the planned transaction belongs to another user', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'tenant-1', 'pt-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an owned planned transaction', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(
        plannedTransactionMock,
      );
      txMock.plannedTransaction.update.mockResolvedValue({
        ...plannedTransactionMock,
        amount: 700,
      });

      const result = await service.update('user-1', 'tenant-1', 'pt-1', {
        amount: 700,
      });

      expect(txMock.plannedTransaction.update).toHaveBeenCalledWith({
        where: { id: 'pt-1' },
        data: {
          accountId: undefined,
          amount: 700,
          type: undefined,
          scheduledAt: undefined,
          isRecurring: undefined,
          interval: undefined,
          categoryId: undefined,
        },
      });
      expect(result.amount).toBe(700);
    });

    it('validates the new account belongs to the user when changing it', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(
        plannedTransactionMock,
      );
      txMock.account.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'tenant-1', 'pt-1', {
          accountId: 'account-other',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the planned transaction belongs to another user', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'tenant-1', 'pt-other', {
          amount: 700,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('requires an interval when setting isRecurring to true', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(
        plannedTransactionMock,
      );

      await expect(
        service.update('user-1', 'tenant-1', 'pt-1', {
          isRecurring: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('softDelete', () => {
    it('rejects pending alerts and sets deletedAt on an owned planned transaction', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(
        plannedTransactionMock,
      );
      txMock.plannedTransaction.update.mockResolvedValue({
        ...plannedTransactionMock,
        deletedAt: new Date(),
      });

      const result = await service.softDelete('user-1', 'tenant-1', 'pt-1');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(txMock.plannedTransactionAlert.updateMany).toHaveBeenCalledWith({
        where: { plannedTransactionId: 'pt-1', status: 'PENDING' },
        data: { status: 'REJECTED', resolvedAt: expect.any(Date) as Date },
      });
      expect(txMock.plannedTransaction.update).toHaveBeenCalledWith({
        where: { id: 'pt-1' },
        data: { deletedAt: expect.any(Date) as Date },
      });
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when the planned transaction belongs to another user', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete('user-1', 'tenant-1', 'pt-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('permanently deletes an owned planned transaction', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(
        plannedTransactionMock,
      );
      prismaMock.plannedTransaction.delete.mockResolvedValue(
        plannedTransactionMock,
      );

      const result = await service.remove('user-1', 'tenant-1', 'pt-1');

      expect(prismaMock.plannedTransaction.delete).toHaveBeenCalledWith({
        where: { id: 'pt-1' },
      });
      expect(result).toEqual(plannedTransactionMock);
    });

    it('throws NotFoundException when the planned transaction belongs to another user', async () => {
      prismaMock.plannedTransaction.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'tenant-1', 'pt-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
