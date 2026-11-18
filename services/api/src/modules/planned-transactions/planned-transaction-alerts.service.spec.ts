import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { TRANSACTION_REQUESTED_EVENT } from '../transactions/events/transaction-requested.event';
import { PlannedTransactionAlertsService } from './planned-transaction-alerts.service';

describe('PlannedTransactionAlertsService', () => {
  let service: PlannedTransactionAlertsService;

  const prismaMock = {
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(prismaTxMock),
    ),
    plannedTransactionAlert: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const prismaTxMock = {
    plannedTransactionAlert: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    plannedTransaction: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    loanInstallment: {
      update: jest.fn(),
    },
  };

  const eventEmitterMock = {
    emitAsync: jest.fn(),
  };

  const alertMock = {
    id: 'al-1',
    plannedTransactionId: 'pt-1',
    tenantId: 'tenant-1',
    accountId: 'account-1',
    amount: 500,
    type: 'EXPENSE',
    categoryId: null,
    dueAt: new Date('2026-08-01T10:00:00.000Z'),
    status: 'PENDING',
    transactionId: null,
    createdAt: new Date(),
    resolvedAt: null,
  };

  const transactionMock = {
    id: 'tx-1',
    accountId: 'account-1',
    tenantId: 'tenant-1',
    amount: 500,
    type: 'EXPENSE',
  };

  const openSeriesMock = {
    id: 'pt-1',
    status: 'ACTIVE',
    deletedAt: null,
    occurrences: null,
    completedOccurrences: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannedTransactionAlertsService,
        TransactionContextService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<PlannedTransactionAlertsService>(
      PlannedTransactionAlertsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('lists alerts for the user accounts', async () => {
      prismaMock.plannedTransactionAlert.findMany.mockResolvedValue([
        alertMock,
      ]);

      const result = await service.findAll('user-1', 'tenant-1');

      expect(prismaMock.plannedTransactionAlert.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          status: undefined,
          account: { userId: 'user-1' },
        },
        include: {
          account: true,
          category: true,
          plannedTransaction: true,
          transaction: true,
        },
        orderBy: { dueAt: 'asc' },
      });
      expect(result).toEqual([alertMock]);
    });

    it('filters by status when provided', async () => {
      prismaMock.plannedTransactionAlert.findMany.mockResolvedValue([
        alertMock,
      ]);

      await service.findAll('user-1', 'tenant-1', 'PENDING');

      expect(prismaMock.plannedTransactionAlert.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          status: 'PENDING',
          account: { userId: 'user-1' },
        },
        include: {
          account: true,
          category: true,
          plannedTransaction: true,
          transaction: true,
        },
        orderBy: { dueAt: 'asc' },
      });
    });

    it('rejects an invalid status filter', async () => {
      await expect(
        service.findAll('user-1', 'tenant-1', 'INVALID'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('approve', () => {
    const claimWhere = {
      id: 'al-1',
      tenantId: 'tenant-1',
      status: 'PENDING',
      account: { userId: 'user-1' },
    };

    it('creates the transaction and marks the alert approved', async () => {
      prismaTxMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 1,
      });
      prismaTxMock.plannedTransactionAlert.findUniqueOrThrow.mockResolvedValue({
        ...alertMock,
        account: { userId: 'user-1' },
      });
      prismaTxMock.plannedTransaction.findUnique.mockResolvedValue(
        openSeriesMock,
      );
      prismaTxMock.plannedTransaction.updateMany.mockResolvedValue({
        count: 1,
      });
      eventEmitterMock.emitAsync.mockResolvedValue([transactionMock]);
      prismaTxMock.plannedTransactionAlert.update.mockResolvedValue({
        ...alertMock,
        status: 'APPROVED',
        transactionId: 'tx-1',
        resolvedAt: new Date(),
      });

      const result = await service.approve('user-1', 'tenant-1', 'al-1');

      expect(
        prismaTxMock.plannedTransactionAlert.updateMany,
      ).toHaveBeenCalledWith({
        where: claimWhere,
        data: {
          status: 'APPROVED',
          resolvedAt: expect.any(Date) as Date,
        },
      });
      expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
        TRANSACTION_REQUESTED_EVENT,
        {
          userId: 'user-1',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          amount: 500,
          type: 'EXPENSE',
          categoryId: undefined,
        },
      );
      expect(prismaTxMock.plannedTransactionAlert.update).toHaveBeenCalledWith({
        where: { id: 'al-1' },
        data: { transactionId: 'tx-1' },
      });
      expect(prismaTxMock.plannedTransaction.updateMany).toHaveBeenCalledWith({
        where: { id: 'pt-1', status: 'ACTIVE', deletedAt: null },
        data: { completedOccurrences: { increment: 1 } },
      });
      expect(result.status).toBe('APPROVED');
    });

    it('consumes an occurrence and closes the series when the limit is reached', async () => {
      prismaTxMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 1,
      });
      prismaTxMock.plannedTransactionAlert.findUniqueOrThrow.mockResolvedValue({
        ...alertMock,
        account: { userId: 'user-1' },
      });
      prismaTxMock.plannedTransaction.findUnique
        .mockResolvedValueOnce({
          ...openSeriesMock,
          occurrences: 3,
          completedOccurrences: 2,
        })
        .mockResolvedValueOnce({
          ...openSeriesMock,
          occurrences: 3,
          completedOccurrences: 3,
        });
      prismaTxMock.plannedTransaction.updateMany.mockResolvedValue({
        count: 1,
      });
      eventEmitterMock.emitAsync.mockResolvedValue([transactionMock]);
      prismaTxMock.plannedTransactionAlert.update.mockResolvedValue({
        ...alertMock,
        status: 'APPROVED',
        transactionId: 'tx-1',
      });
      prismaTxMock.plannedTransaction.update.mockResolvedValue({
        ...openSeriesMock,
        status: 'COMPLETED',
      });

      await service.approve('user-1', 'tenant-1', 'al-1');

      expect(prismaTxMock.plannedTransaction.update).toHaveBeenCalledWith({
        where: { id: 'pt-1' },
        data: { status: 'COMPLETED' },
      });
      expect(
        prismaTxMock.plannedTransactionAlert.updateMany,
      ).toHaveBeenCalledWith({
        where: { plannedTransactionId: 'pt-1', status: 'PENDING' },
        data: { status: 'REJECTED', resolvedAt: expect.any(Date) as Date },
      });
    });

    it('throws BadRequestException when the occurrence limit is already reached', async () => {
      prismaTxMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 1,
      });
      prismaTxMock.plannedTransactionAlert.findUniqueOrThrow.mockResolvedValue({
        ...alertMock,
        account: { userId: 'user-1' },
      });
      prismaTxMock.plannedTransaction.findUnique.mockResolvedValue({
        ...openSeriesMock,
        occurrences: 3,
        completedOccurrences: 3,
      });

      await expect(
        service.approve('user-1', 'tenant-1', 'al-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(eventEmitterMock.emitAsync).not.toHaveBeenCalled();
    });

    it('marks the loan installment linked to the alert as paid', async () => {
      prismaTxMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 1,
      });
      prismaTxMock.plannedTransactionAlert.findUniqueOrThrow.mockResolvedValue({
        ...alertMock,
        loanInstallmentId: 'li-1',
        account: { userId: 'user-1' },
      });
      prismaTxMock.plannedTransaction.findUnique.mockResolvedValue(
        openSeriesMock,
      );
      prismaTxMock.plannedTransaction.updateMany.mockResolvedValue({
        count: 1,
      });
      eventEmitterMock.emitAsync.mockResolvedValue([transactionMock]);
      prismaTxMock.plannedTransactionAlert.update.mockResolvedValue({
        ...alertMock,
        status: 'APPROVED',
        transactionId: 'tx-1',
      });

      await service.approve('user-1', 'tenant-1', 'al-1');

      expect(prismaTxMock.loanInstallment.update).toHaveBeenCalledWith({
        where: { id: 'li-1' },
        data: {
          status: 'PAID',
          paidAt: expect.any(Date) as Date,
          transactionId: 'tx-1',
        },
      });
    });

    it('throws NotFoundException when the alert is not found', async () => {
      prismaTxMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 0,
      });
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue(null);

      await expect(
        service.approve('user-1', 'tenant-1', 'al-other'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(eventEmitterMock.emitAsync).not.toHaveBeenCalled();
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.approve('user-1', null, 'al-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException when the alert is already resolved', async () => {
      prismaTxMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 0,
      });
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue({
        ...alertMock,
        status: 'APPROVED',
        account: { userId: 'user-1' },
      });

      await expect(
        service.approve('user-1', 'tenant-1', 'al-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(eventEmitterMock.emitAsync).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    const claimWhere = {
      id: 'al-1',
      tenantId: 'tenant-1',
      status: 'PENDING',
      account: { userId: 'user-1' },
    };

    it('marks the alert rejected', async () => {
      prismaMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 1,
      });
      prismaMock.plannedTransactionAlert.findUniqueOrThrow.mockResolvedValue({
        ...alertMock,
        status: 'REJECTED',
        resolvedAt: new Date(),
      });

      const result = await service.reject('user-1', 'tenant-1', 'al-1');

      expect(
        prismaMock.plannedTransactionAlert.updateMany,
      ).toHaveBeenCalledWith({
        where: claimWhere,
        data: {
          status: 'REJECTED',
          resolvedAt: expect.any(Date) as Date,
        },
      });
      expect(result.status).toBe('REJECTED');
    });

    it('throws NotFoundException when the alert is not found', async () => {
      prismaMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 0,
      });
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue(null);

      await expect(
        service.reject('user-1', 'tenant-1', 'al-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the alert is already resolved', async () => {
      prismaMock.plannedTransactionAlert.updateMany.mockResolvedValue({
        count: 0,
      });
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue({
        ...alertMock,
        status: 'APPROVED',
        account: { userId: 'user-1' },
      });

      await expect(
        service.reject('user-1', 'tenant-1', 'al-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.reject('user-1', null, 'al-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
