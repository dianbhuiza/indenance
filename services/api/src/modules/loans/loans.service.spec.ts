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
import { LoansService } from './loans.service';

describe('LoansService', () => {
  let service: LoansService;
  let txContext: TransactionContextService;

  const txMock = {
    account: {
      findFirst: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    loan: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    loanInstallment: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    plannedTransaction: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    plannedTransactionAlert: {
      updateMany: jest.fn(),
    },
  };

  const prismaMock = {
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(txMock),
    ),
    loan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    loanInstallment: {
      findFirst: jest.fn(),
    },
  };

  const eventEmitterMock = {
    emitAsync: jest.fn(),
  };

  const accountMock = {
    id: 'account-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    balance: 100,
  };

  const loanMock = {
    id: 'loan-1',
    name: null,
    accountId: 'account-1',
    tenantId: 'tenant-1',
    principal: 10000,
    interestPercent: 10,
    totalRepayment: 11000,
    interestAmount: 1000,
    installments: 11,
    installmentAmount: 1000,
    interval: 'MONTHLY',
    startDate: new Date('2026-10-05T00:00:00.000Z'),
    status: 'ACTIVE',
    deletedAt: null,
    categoryId: null,
    plannedTransaction: null,
    installmentRecords: [],
  };

  const baseDto = {
    accountId: 'account-1',
    principal: 10000,
    interestPercent: 10,
    installments: 11,
    interval: 'MONTHLY' as const,
    startDate: new Date('2026-10-05T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        TransactionContextService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    txContext = module.get<TransactionContextService>(
      TransactionContextService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates the loan with its installments and disburses the capital', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.loan.create.mockResolvedValue({ id: 'loan-1' });
      txMock.loanInstallment.createMany.mockResolvedValue({ count: 11 });
      txMock.loan.findUniqueOrThrow.mockResolvedValue(loanMock);
      eventEmitterMock.emitAsync.mockResolvedValue([{ id: 'tx-in' }]);

      const result = await service.create('user-1', 'tenant-1', baseDto);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(txMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'account-1', userId: 'user-1', tenantId: 'tenant-1' },
      });
      expect(txMock.loan.create).toHaveBeenCalledWith({
        data: {
          name: null,
          accountId: 'account-1',
          tenantId: 'tenant-1',
          principal: 10000,
          interestPercent: 10,
          totalRepayment: 11000,
          interestAmount: 1000,
          installments: 11,
          installmentAmount: 1000,
          interval: 'MONTHLY',
          startDate: baseDto.startDate,
          categoryId: null,
        },
      });
      expect(txMock.loanInstallment.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            loanId: 'loan-1',
            number: 1,
            dueAt: baseDto.startDate,
            amount: 1000,
          }),
        ]) as unknown[],
      });
      expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
        TRANSACTION_REQUESTED_EVENT,
        {
          userId: 'user-1',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          amount: 10000,
          type: 'INCOME',
        },
      );
      expect(result).toEqual(loanMock);
    });

    it('derives the percentage when the total to return is provided', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.loan.create.mockResolvedValue({ id: 'loan-1' });
      txMock.loanInstallment.createMany.mockResolvedValue({ count: 3 });
      txMock.loan.findUniqueOrThrow.mockResolvedValue(loanMock);
      eventEmitterMock.emitAsync.mockResolvedValue([{ id: 'tx-in' }]);

      await service.create('user-1', 'tenant-1', {
        accountId: 'account-1',
        principal: 3000,
        totalRepayment: 3450,
        installments: 3,
        interval: 'MONTHLY',
        startDate: baseDto.startDate,
      });

      expect(txMock.loan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          interestPercent: 15,
          interestAmount: 450,
          totalRepayment: 3450,
          installmentAmount: 1150,
        }) as object,
      });
    });

    it('creates the linked recurring payment when requested', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.category.findFirst.mockResolvedValue({
        id: 'cat-1',
        tenantId: 'tenant-1',
      });
      txMock.loan.create.mockResolvedValue({ id: 'loan-1' });
      txMock.loanInstallment.createMany.mockResolvedValue({ count: 11 });
      txMock.loan.findUniqueOrThrow.mockResolvedValue(loanMock);
      eventEmitterMock.emitAsync.mockResolvedValue([{ id: 'tx-in' }]);

      await service.create('user-1', 'tenant-1', {
        ...baseDto,
        recurring: { requiresApproval: false, categoryId: 'cat-1' },
      });

      expect(txMock.plannedTransaction.create).toHaveBeenCalledWith({
        data: {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          amount: 1000,
          type: 'EXPENSE',
          scheduledAt: baseDto.startDate,
          isRecurring: true,
          interval: 'MONTHLY',
          requiresApproval: false,
          occurrences: 11,
          categoryId: 'cat-1',
          loanId: 'loan-1',
        },
      });
    });

    it('does not disburse the capital when disburseNow is false', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.loan.create.mockResolvedValue({ id: 'loan-1' });
      txMock.loanInstallment.createMany.mockResolvedValue({ count: 11 });
      txMock.loan.findUniqueOrThrow.mockResolvedValue(loanMock);

      await service.create('user-1', 'tenant-1', {
        ...baseDto,
        disburseNow: false,
      });

      expect(eventEmitterMock.emitAsync).not.toHaveBeenCalled();
    });

    it('requires exactly one interest input', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);

      await expect(
        service.create('user-1', 'tenant-1', {
          accountId: 'account-1',
          principal: 10000,
          installments: 11,
          interval: 'MONTHLY',
          startDate: baseDto.startDate,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        service.create('user-1', 'tenant-1', {
          ...baseDto,
          totalRepayment: 11000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(txMock.loan.create).not.toHaveBeenCalled();
    });

    it('rejects a category that belongs to another tenant', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'tenant-1', {
          ...baseDto,
          categoryId: 'cat-foreign',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the account is not owned by the user', async () => {
      txMock.account.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'tenant-1', baseDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.create('user-1', null, baseDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('reuses the ambient transaction client when called inside a context', async () => {
      txMock.account.findFirst.mockResolvedValue(accountMock);
      txMock.loan.create.mockResolvedValue({ id: 'loan-1' });
      txMock.loanInstallment.createMany.mockResolvedValue({ count: 11 });
      txMock.loan.findUniqueOrThrow.mockResolvedValue(loanMock);
      eventEmitterMock.emitAsync.mockResolvedValue([{ id: 'tx-in' }]);

      await txContext.run(() => service.create('user-1', 'tenant-1', baseDto));

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('lists non-deleted loans for the user accounts', async () => {
      prismaMock.loan.findMany.mockResolvedValue([loanMock]);

      const result = await service.findAll('user-1', 'tenant-1');

      expect(prismaMock.loan.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          deletedAt: null,
          status: undefined,
          account: { userId: 'user-1' },
        },
        include: {
          account: true,
          category: true,
          plannedTransaction: true,
          installmentRecords: { orderBy: { number: 'asc' } },
        },
        orderBy: { startDate: 'desc' },
      });
      expect(result).toEqual([loanMock]);
    });

    it('filters by status when provided', async () => {
      prismaMock.loan.findMany.mockResolvedValue([loanMock]);

      await service.findAll('user-1', 'tenant-1', 'COMPLETED');

      expect(prismaMock.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED' }) as object,
        }) as object,
      );
    });

    it('rejects an invalid status filter', async () => {
      await expect(
        service.findAll('user-1', 'tenant-1', 'INVALID'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects users without a tenant', async () => {
      await expect(service.findAll('user-1', null)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('returns a loan owned by the user in the tenant', async () => {
      prismaMock.loan.findFirst.mockResolvedValue(loanMock);

      const result = await service.findOne('user-1', 'tenant-1', 'loan-1');

      expect(prismaMock.loan.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'loan-1',
          tenantId: 'tenant-1',
          deletedAt: null,
          account: { userId: 'user-1' },
        },
        include: {
          account: true,
          category: true,
          plannedTransaction: true,
          installmentRecords: { orderBy: { number: 'asc' } },
        },
      });
      expect(result).toEqual(loanMock);
    });

    it('throws NotFoundException when the loan belongs to another user', async () => {
      prismaMock.loan.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'tenant-1', 'loan-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('renames an owned loan', async () => {
      prismaMock.loan.findFirst
        .mockResolvedValueOnce(loanMock)
        .mockResolvedValueOnce({ ...loanMock, name: 'Nuevo nombre' });
      prismaMock.loan.update.mockResolvedValue({
        ...loanMock,
        name: 'Nuevo nombre',
      });

      const result = await service.update('user-1', 'tenant-1', 'loan-1', {
        name: 'Nuevo nombre',
      });

      expect(prismaMock.loan.update).toHaveBeenCalledWith({
        where: { id: 'loan-1' },
        data: { name: 'Nuevo nombre' },
      });
      expect(result.name).toBe('Nuevo nombre');
    });
  });

  describe('payInstallment', () => {
    const installmentMock = {
      id: 'li-1',
      loanId: 'loan-1',
      number: 1,
      amount: 1000,
      status: 'PENDING',
      transactionId: null,
    };

    it('records the payment and completes the loan with no pending installments', async () => {
      prismaMock.loan.findFirst.mockResolvedValue(loanMock);
      prismaMock.loanInstallment.findFirst.mockResolvedValue(installmentMock);
      txMock.loanInstallment.updateMany.mockResolvedValue({ count: 1 });
      eventEmitterMock.emitAsync.mockResolvedValue([{ id: 'tx-1' }]);
      txMock.loanInstallment.update.mockResolvedValue({});
      txMock.loanInstallment.count.mockResolvedValue(0);
      txMock.loan.updateMany.mockResolvedValue({ count: 1 });
      txMock.loanInstallment.findUniqueOrThrow.mockResolvedValue({
        ...installmentMock,
        status: 'PAID',
        transactionId: 'tx-1',
      });

      const result = await service.payInstallment(
        'user-1',
        'tenant-1',
        'loan-1',
        'li-1',
      );

      expect(txMock.loanInstallment.updateMany).toHaveBeenCalledWith({
        where: { id: 'li-1', status: 'PENDING' },
        data: { status: 'PAID', paidAt: expect.any(Date) as Date },
      });
      expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
        TRANSACTION_REQUESTED_EVENT,
        {
          userId: 'user-1',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          amount: 1000,
          type: 'EXPENSE',
          categoryId: undefined,
        },
      );
      expect(txMock.loanInstallment.update).toHaveBeenCalledWith({
        where: { id: 'li-1' },
        data: { transactionId: 'tx-1' },
      });
      expect(txMock.loan.updateMany).toHaveBeenCalledWith({
        where: { id: 'loan-1', status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });
      expect(result.status).toBe('PAID');
    });

    it('keeps the loan active while installments are still pending', async () => {
      prismaMock.loan.findFirst.mockResolvedValue(loanMock);
      prismaMock.loanInstallment.findFirst.mockResolvedValue(installmentMock);
      txMock.loanInstallment.updateMany.mockResolvedValue({ count: 1 });
      eventEmitterMock.emitAsync.mockResolvedValue([{ id: 'tx-1' }]);
      txMock.loanInstallment.update.mockResolvedValue({});
      txMock.loanInstallment.count.mockResolvedValue(2);
      txMock.loanInstallment.findUniqueOrThrow.mockResolvedValue({
        ...installmentMock,
        status: 'PAID',
      });

      await service.payInstallment('user-1', 'tenant-1', 'loan-1', 'li-1');

      expect(txMock.loan.updateMany).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the installment is already paid', async () => {
      prismaMock.loan.findFirst.mockResolvedValue(loanMock);
      prismaMock.loanInstallment.findFirst.mockResolvedValue({
        ...installmentMock,
        status: 'PAID',
      });

      await expect(
        service.payInstallment('user-1', 'tenant-1', 'loan-1', 'li-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(eventEmitterMock.emitAsync).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the installment belongs to another loan', async () => {
      prismaMock.loan.findFirst.mockResolvedValue(loanMock);
      prismaMock.loanInstallment.findFirst.mockResolvedValue(null);

      await expect(
        service.payInstallment('user-1', 'tenant-1', 'loan-1', 'li-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the loan is not active', async () => {
      prismaMock.loan.findFirst.mockResolvedValue({
        ...loanMock,
        status: 'CANCELLED',
      });

      await expect(
        service.payInstallment('user-1', 'tenant-1', 'loan-1', 'li-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove', () => {
    it('cancels the loan and closes its recurring payment', async () => {
      prismaMock.loan.findFirst.mockResolvedValue({
        ...loanMock,
        plannedTransaction: { id: 'pt-1' },
      });
      txMock.loan.update.mockResolvedValue({
        ...loanMock,
        status: 'CANCELLED',
      });
      txMock.loan.findUniqueOrThrow.mockResolvedValue({
        ...loanMock,
        status: 'CANCELLED',
      });

      const result = await service.remove('user-1', 'tenant-1', 'loan-1');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(txMock.loan.update).toHaveBeenCalledWith({
        where: { id: 'loan-1' },
        data: {
          deletedAt: expect.any(Date) as Date,
          status: 'CANCELLED',
        },
      });
      expect(txMock.plannedTransaction.updateMany).toHaveBeenCalledWith({
        where: { id: 'pt-1', deletedAt: null, status: 'ACTIVE' },
        data: { deletedAt: expect.any(Date) as Date },
      });
      expect(txMock.plannedTransactionAlert.updateMany).toHaveBeenCalledWith({
        where: { plannedTransactionId: 'pt-1', status: 'PENDING' },
        data: { status: 'REJECTED', resolvedAt: expect.any(Date) as Date },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('throws NotFoundException when the loan belongs to another user', async () => {
      prismaMock.loan.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'tenant-1', 'loan-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
