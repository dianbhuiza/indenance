import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  Prisma,
  ShoppingList,
  ShoppingListItem,
} from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import {
  TRANSACTION_REQUESTED_EVENT,
  type TransactionRequestedPayload,
} from '../transactions/events/transaction-requested.event';
import { CreateShoppingListItemDto } from './dto/create-shopping-list-item.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { PurchaseShoppingListDto } from './dto/purchase-shopping-list.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';

@Injectable()
export class ShoppingListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private assertTenant(tenantId: string | null): asserts tenantId is string {
    if (!tenantId)
      throw new ForbiddenException('User does not belong to a tenant');
  }

  async create(
    userId: string,
    tenantId: string | null,
    dto: CreateShoppingListDto,
  ): Promise<ShoppingList> {
    this.assertTenant(tenantId);
    void userId;
    return this.prisma.shoppingList.create({
      data: { name: dto.name, tenantId },
      include: { items: true },
    });
  }

  async findAll(
    tenantId: string | null,
    status?: string,
  ): Promise<ShoppingList[]> {
    if (status && !['OPEN', 'PURCHASED'].includes(status)) {
      throw new BadRequestException('status must be one of OPEN, PURCHASED');
    }
    return this.prisma.shoppingList.findMany({
      where: {
        tenantId: tenantId ?? undefined,
        deletedAt: null,
        purchasedAt:
          status === 'PURCHASED'
            ? { not: null }
            : status === 'OPEN'
              ? null
              : undefined,
      },
      include: { items: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(
    tenantId: string | null,
    id: string,
  ): Promise<ShoppingList & { items: ShoppingListItem[] }> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id, tenantId: tenantId ?? undefined, deletedAt: null },
      include: { items: true },
    });
    if (!list)
      throw new NotFoundException(`ShoppingList with id ${id} not found`);
    return list;
  }

  async update(
    tenantId: string | null,
    id: string,
    dto: UpdateShoppingListDto,
  ): Promise<ShoppingList> {
    await this.findOne(tenantId, id);
    return this.prisma.shoppingList.update({
      where: { id },
      data: dto,
      include: { items: true },
    });
  }

  async softDelete(tenantId: string | null, id: string): Promise<ShoppingList> {
    await this.findOne(tenantId, id);
    return this.prisma.shoppingList.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async remove(tenantId: string | null, id: string): Promise<ShoppingList> {
    await this.findOne(tenantId, id);
    return this.prisma.shoppingList.delete({ where: { id } });
  }

  async addItem(
    tenantId: string | null,
    listId: string,
    dto: CreateShoppingListItemDto,
  ): Promise<ShoppingListItem> {
    await this.findOne(tenantId, listId);
    await this.assertCategoryBelongsToTenant(tenantId, dto.categoryId);
    return this.prisma.shoppingListItem.create({
      data: {
        name: dto.name,
        quantity: dto.quantity ?? 1,
        price: dto.price ?? null,
        categoryId: dto.categoryId ?? null,
        shoppingListId: listId,
      },
    });
  }

  async updateItem(
    tenantId: string | null,
    listId: string,
    itemId: string,
    dto: UpdateShoppingListItemDto,
  ): Promise<ShoppingListItem> {
    await this.findOne(tenantId, listId);
    const item = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingListId: listId },
    });
    if (!item)
      throw new NotFoundException(
        `ShoppingListItem with id ${itemId} not found`,
      );
    await this.assertCategoryBelongsToTenant(tenantId, dto.categoryId);

    return this.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeItem(
    tenantId: string | null,
    listId: string,
    itemId: string,
  ): Promise<ShoppingListItem> {
    await this.findOne(tenantId, listId);
    const item = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingListId: listId },
    });
    if (!item)
      throw new NotFoundException(
        `ShoppingListItem with id ${itemId} not found`,
      );
    return this.prisma.shoppingListItem.delete({ where: { id: itemId } });
  }

  async purchase(
    userId: string,
    tenantId: string | null,
    id: string,
    dto: PurchaseShoppingListDto,
  ): Promise<ShoppingList & { items: ShoppingListItem[] }> {
    this.assertTenant(tenantId);
    const list = await this.findOne(tenantId, id);
    if (list.purchasedAt)
      throw new BadRequestException('ShoppingList already purchased');

    const purchasedItems = list.items.filter((item) => item.isPurchased);
    if (purchasedItems.length === 0)
      throw new BadRequestException('No items marked as purchased');

    const total = purchasedItems.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0,
    );
    if (total <= 0)
      throw new BadRequestException(
        'Purchased items must have a price greater than 0',
      );

    return this.txContext.run(async () => {
      const payload: TransactionRequestedPayload = {
        userId,
        tenantId,
        accountId: dto.accountId,
        amount: total,
        type: 'EXPENSE',
        categoryId: dto.categoryId ?? undefined,
      };

      const results = await this.eventEmitter.emitAsync(
        TRANSACTION_REQUESTED_EVENT,
        payload,
      );
      const transaction = results[0] as { id: string } | undefined;
      if (!transaction)
        throw new Error('No handler processed the transaction request');

      const tx = this.txContext.client();
      await tx.shoppingListItem.deleteMany({
        where: { shoppingListId: id, isPurchased: false },
      });
      return tx.shoppingList.update({
        where: { id },
        data: { purchasedAt: new Date() },
        include: { items: true },
      });
    });
  }

  private async assertCategoryBelongsToTenant(
    tenantId: string | null,
    categoryId?: string,
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId: tenantId ?? undefined },
    });
    if (!category)
      throw new NotFoundException(`Category with id ${categoryId} not found`);
  }
}

export type { Prisma };
