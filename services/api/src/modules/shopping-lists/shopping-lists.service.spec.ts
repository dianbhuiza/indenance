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
import { ShoppingListsService } from './shopping-lists.service';

describe('ShoppingListsService', () => {
  let service: ShoppingListsService;

  const prismaMock = {
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(prismaTxMock),
    ),
    shoppingList: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shoppingListItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
  };

  const prismaTxMock = {
    shoppingListItem: {
      deleteMany: jest.fn(),
    },
    shoppingList: {
      update: jest.fn(),
    },
  };

  const eventEmitterMock = {
    emitAsync: jest.fn(),
  };

  const listMock = {
    id: 'list-1',
    name: 'Mercado',
    tenantId: 'tenant-1',
    deletedAt: null,
    purchasedAt: null,
    items: [
      {
        id: 'item-1',
        name: 'Leche',
        quantity: 2,
        isPurchased: true,
        price: 50,
      },
      {
        id: 'item-2',
        name: 'Pan',
        quantity: 1,
        isPurchased: false,
        price: 20,
      },
    ],
  };

  const transactionMock = {
    id: 'tx-1',
    accountId: 'account-1',
    tenantId: 'tenant-1',
    amount: 100,
    type: 'EXPENSE',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListsService,
        TransactionContextService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<ShoppingListsService>(ShoppingListsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a list for the tenant', async () => {
      prismaMock.shoppingList.create.mockResolvedValue(listMock);

      const result = await service.create('user-1', 'tenant-1', {
        name: 'Mercado',
      });

      expect(prismaMock.shoppingList.create).toHaveBeenCalledWith({
        data: { name: 'Mercado', tenantId: 'tenant-1' },
        include: { items: true },
      });
      expect(result).toEqual(listMock);
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.create('user-1', null, { name: 'Mercado' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('lists non-deleted lists for the tenant', async () => {
      prismaMock.shoppingList.findMany.mockResolvedValue([listMock]);

      const result = await service.findAll('tenant-1');

      expect(prismaMock.shoppingList.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          deletedAt: null,
          purchasedAt: undefined,
        },
        include: { items: true },
        orderBy: { id: 'desc' },
      });
      expect(result).toEqual([listMock]);
    });

    it('filters by status OPEN', async () => {
      prismaMock.shoppingList.findMany.mockResolvedValue([listMock]);

      await service.findAll('tenant-1', 'OPEN');

      expect(prismaMock.shoppingList.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', deletedAt: null, purchasedAt: null },
        include: { items: true },
        orderBy: { id: 'desc' },
      });
    });

    it('filters by status PURCHASED', async () => {
      prismaMock.shoppingList.findMany.mockResolvedValue([listMock]);

      await service.findAll('tenant-1', 'PURCHASED');

      expect(prismaMock.shoppingList.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          deletedAt: null,
          purchasedAt: { not: null },
        },
        include: { items: true },
        orderBy: { id: 'desc' },
      });
    });

    it('rejects an invalid status filter', async () => {
      await expect(
        service.findAll('tenant-1', 'INVALID'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns the list with items', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);

      const result = await service.findOne('tenant-1', 'list-1');

      expect(prismaMock.shoppingList.findFirst).toHaveBeenCalledWith({
        where: { id: 'list-1', tenantId: 'tenant-1', deletedAt: null },
        include: { items: true },
      });
      expect(result).toEqual(listMock);
    });

    it('throws NotFoundException when the list is not found', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('tenant-1', 'list-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the list', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.shoppingList.update.mockResolvedValue({
        ...listMock,
        name: 'Mercado grande',
      });

      const result = await service.update('tenant-1', 'list-1', {
        name: 'Mercado grande',
      });

      expect(prismaMock.shoppingList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { name: 'Mercado grande' },
        include: { items: true },
      });
      expect(result.name).toBe('Mercado grande');
    });
  });

  describe('softDelete', () => {
    it('soft deletes the list', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.shoppingList.update.mockResolvedValue({
        ...listMock,
        deletedAt: new Date(),
      });

      const result = await service.softDelete('tenant-1', 'list-1');

      expect(prismaMock.shoppingList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { deletedAt: expect.any(Date) as Date },
      });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('removes the list', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.shoppingList.delete.mockResolvedValue(listMock);

      const result = await service.remove('tenant-1', 'list-1');

      expect(prismaMock.shoppingList.delete).toHaveBeenCalledWith({
        where: { id: 'list-1' },
      });
      expect(result).toEqual(listMock);
    });
  });

  describe('addItem', () => {
    it('adds an item to the list', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.shoppingListItem.create.mockResolvedValue({
        id: 'item-3',
        name: 'Huevos',
        quantity: 12,
        price: 5,
        categoryId: null,
        shoppingListId: 'list-1',
      });

      const result = await service.addItem('tenant-1', 'list-1', {
        name: 'Huevos',
        quantity: 12,
        price: 5,
      });

      expect(prismaMock.shoppingListItem.create).toHaveBeenCalledWith({
        data: {
          name: 'Huevos',
          quantity: 12,
          price: 5,
          categoryId: null,
          shoppingListId: 'list-1',
        },
      });
      expect(result.name).toBe('Huevos');
    });

    it('validates the category belongs to the tenant', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(
        service.addItem('tenant-1', 'list-1', {
          name: 'Huevos',
          categoryId: 'cat-other',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateItem', () => {
    it('updates an item and marks it purchased', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.shoppingListItem.findFirst.mockResolvedValue(
        listMock.items[0],
      );
      prismaMock.shoppingListItem.update.mockResolvedValue({
        ...listMock.items[0],
        isPurchased: true,
      });

      const result = await service.updateItem('tenant-1', 'list-1', 'item-1', {
        isPurchased: true,
      });

      expect(prismaMock.shoppingListItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { isPurchased: true },
      });
      expect(result.isPurchased).toBe(true);
    });

    it('throws NotFoundException when the item is not found', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.shoppingListItem.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItem('tenant-1', 'list-1', 'item-other', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('removes an item from the list', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      prismaMock.shoppingListItem.findFirst.mockResolvedValue(
        listMock.items[1],
      );
      prismaMock.shoppingListItem.delete.mockResolvedValue(listMock.items[1]);

      const result = await service.removeItem('tenant-1', 'list-1', 'item-2');

      expect(prismaMock.shoppingListItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-2' },
      });
      expect(result.name).toBe('Pan');
    });
  });

  describe('purchase', () => {
    it('creates the transaction for purchased items and deletes the rest', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      eventEmitterMock.emitAsync.mockResolvedValue([transactionMock]);
      prismaTxMock.shoppingListItem.deleteMany.mockResolvedValue({ count: 1 });
      prismaTxMock.shoppingList.update.mockResolvedValue({
        ...listMock,
        purchasedAt: new Date(),
      });

      const result = await service.purchase('user-1', 'tenant-1', 'list-1', {
        accountId: 'account-1',
      });

      expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
        TRANSACTION_REQUESTED_EVENT,
        {
          userId: 'user-1',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          amount: 100,
          type: 'EXPENSE',
          categoryId: undefined,
        },
      );
      expect(prismaTxMock.shoppingListItem.deleteMany).toHaveBeenCalledWith({
        where: { shoppingListId: 'list-1', isPurchased: false },
      });
      expect(prismaTxMock.shoppingList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { purchasedAt: expect.any(Date) as Date },
        include: { items: true },
      });
      expect(result.purchasedAt).toBeInstanceOf(Date);
    });

    it('passes the category to the transaction request', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(listMock);
      eventEmitterMock.emitAsync.mockResolvedValue([transactionMock]);
      prismaTxMock.shoppingListItem.deleteMany.mockResolvedValue({ count: 1 });
      prismaTxMock.shoppingList.update.mockResolvedValue({
        ...listMock,
        purchasedAt: new Date(),
      });

      await service.purchase('user-1', 'tenant-1', 'list-1', {
        accountId: 'account-1',
        categoryId: 'cat-1',
      });

      expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
        TRANSACTION_REQUESTED_EVENT,
        {
          userId: 'user-1',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          amount: 100,
          type: 'EXPENSE',
          categoryId: 'cat-1',
        },
      );
    });

    it('rejects users without a tenant', async () => {
      await expect(
        service.purchase('user-1', null, 'list-1', {
          accountId: 'account-1',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException when the list is already purchased', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue({
        ...listMock,
        purchasedAt: new Date(),
      });

      await expect(
        service.purchase('user-1', 'tenant-1', 'list-1', {
          accountId: 'account-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when no items are marked as purchased', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue({
        ...listMock,
        items: [{ ...listMock.items[1] }],
      });

      await expect(
        service.purchase('user-1', 'tenant-1', 'list-1', {
          accountId: 'account-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when the total is zero', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue({
        ...listMock,
        items: [{ ...listMock.items[0], price: 0 }],
      });

      await expect(
        service.purchase('user-1', 'tenant-1', 'list-1', {
          accountId: 'account-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when the list is not found', async () => {
      prismaMock.shoppingList.findFirst.mockResolvedValue(null);

      await expect(
        service.purchase('user-1', 'tenant-1', 'list-other', {
          accountId: 'account-1',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
