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
      update: jest.fn(),
    },
  };

  const prismaTxMock = {
    plannedTransactionAlert: {
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
    it('creates the transaction and marks the alert approved', async () => {
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue({
        ...alertMock,
        account: { userId: 'user-1' },
      });
      eventEmitterMock.emitAsync.mockResolvedValue([transactionMock]);
      prismaTxMock.plannedTransactionAlert.update.mockResolvedValue({
        ...alertMock,
        status: 'APPROVED',
        transactionId: 'tx-1',
        resolvedAt: new Date(),
      });

      const result = await service.approve('user-1', 'tenant-1', 'al-1');

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
        data: {
          status: 'APPROVED',
          transactionId: 'tx-1',
          resolvedAt: expect.any(Date) as Date,
        },
      });
      expect(result.status).toBe('APPROVED');
    });

    it('throws NotFoundException when the alert is not found', async () => {
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue(null);

      await expect(
        service.approve('user-1', 'tenant-1', 'al-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.approve('user-1', null, 'al-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException when the alert is already resolved', async () => {
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue({
        ...alertMock,
        status: 'APPROVED',
        account: { userId: 'user-1' },
      });

      await expect(
        service.approve('user-1', 'tenant-1', 'al-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('reject', () => {
    it('marks the alert rejected', async () => {
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue({
        ...alertMock,
        account: { userId: 'user-1' },
      });
      prismaMock.plannedTransactionAlert.update.mockResolvedValue({
        ...alertMock,
        status: 'REJECTED',
        resolvedAt: new Date(),
      });

      const result = await service.reject('user-1', 'tenant-1', 'al-1');

      expect(prismaMock.plannedTransactionAlert.update).toHaveBeenCalledWith({
        where: { id: 'al-1' },
        data: { status: 'REJECTED', resolvedAt: expect.any(Date) as Date },
      });
      expect(result.status).toBe('REJECTED');
    });

    it('throws NotFoundException when the alert is not found', async () => {
      prismaMock.plannedTransactionAlert.findFirst.mockResolvedValue(null);

      await expect(
        service.reject('user-1', 'tenant-1', 'al-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.reject('user-1', null, 'al-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
