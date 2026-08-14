import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  const prismaMock = {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const accountMock = {
    id: 'account-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    name: 'Tarjeta de crédito',
    currency: 'MXN',
    balance: 50000,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates an account scoped to the user tenant', async () => {
      prismaMock.account.create.mockResolvedValue(accountMock);

      const result = await service.create('user-1', 'tenant-1', {
        name: 'Tarjeta de crédito',
        currency: 'MXN',
        balance: 50000,
      });

      expect(prismaMock.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tenantId: 'tenant-1',
          name: 'Tarjeta de crédito',
          currency: 'MXN',
          balance: 50000,
        },
      });
      expect(result).toEqual(accountMock);
    });

    it('defaults balance to 0 when not provided', async () => {
      prismaMock.account.create.mockResolvedValue({
        ...accountMock,
        balance: 0,
      });

      await service.create('user-1', 'tenant-1', {
        name: 'Efectivo',
        currency: 'MXN',
      });

      expect(prismaMock.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tenantId: 'tenant-1',
          name: 'Efectivo',
          currency: 'MXN',
          balance: 0,
        },
      });
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.create('user-1', null, {
          name: 'Efectivo',
          currency: 'MXN',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('filters accounts by userId and tenantId', async () => {
      prismaMock.account.findMany.mockResolvedValue([accountMock]);

      const result = await service.findAll('user-1', 'tenant-1');

      expect(prismaMock.account.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', tenantId: 'tenant-1' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([accountMock]);
    });
  });

  describe('findOne', () => {
    it('returns the account owned by the user in the tenant', async () => {
      prismaMock.account.findFirst.mockResolvedValue(accountMock);

      const result = await service.findOne('user-1', 'tenant-1', 'account-1');

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'account-1', userId: 'user-1', tenantId: 'tenant-1' },
      });
      expect(result).toEqual(accountMock);
    });

    it('throws NotFoundException when the account is not owned by the user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'tenant-1', 'account-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an owned account', async () => {
      prismaMock.account.findFirst.mockResolvedValue(accountMock);
      prismaMock.account.update.mockResolvedValue({
        ...accountMock,
        name: 'Efectivo',
      });

      const result = await service.update('user-1', 'tenant-1', 'account-1', {
        name: 'Efectivo',
      });

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: { name: 'Efectivo' },
      });
      expect(result.name).toBe('Efectivo');
    });

    it('throws NotFoundException when the account belongs to another user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'tenant-1', 'account-other', {
          name: 'Efectivo',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes an owned account', async () => {
      prismaMock.account.findFirst.mockResolvedValue(accountMock);
      prismaMock.account.delete.mockResolvedValue(accountMock);

      const result = await service.remove('user-1', 'tenant-1', 'account-1');

      expect(prismaMock.account.delete).toHaveBeenCalledWith({
        where: { id: 'account-1' },
      });
      expect(result).toEqual(accountMock);
    });

    it('throws NotFoundException when the account belongs to another user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'tenant-1', 'account-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
