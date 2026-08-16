import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import type {
  ShoppingList,
  ShoppingListItem,
} from '../../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateShoppingListItemDto } from './dto/create-shopping-list-item.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { PurchaseShoppingListDto } from './dto/purchase-shopping-list.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { ShoppingListsService } from './shopping-lists.service';

@Controller('shopping-lists')
@UseGuards(AuthGuard)
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Post()
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateShoppingListDto,
  ): Promise<ShoppingList> {
    return this.shoppingListsService.create(
      request.user.userId,
      request.user.tenantId,
      dto,
    );
  }

  @Get()
  findAll(
    @Request() request: AuthenticatedRequest,
    @Query('status') status?: string,
  ): Promise<ShoppingList[]> {
    return this.shoppingListsService.findAll(request.user.tenantId, status);
  }

  @Get(':id')
  findOne(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ShoppingList & { items: ShoppingListItem[] }> {
    return this.shoppingListsService.findOne(request.user.tenantId, id);
  }

  @Patch(':id')
  update(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateShoppingListDto,
  ): Promise<ShoppingList> {
    return this.shoppingListsService.update(request.user.tenantId, id, dto);
  }

  @Delete(':id')
  softDelete(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ShoppingList> {
    return this.shoppingListsService.softDelete(request.user.tenantId, id);
  }

  @Delete(':id/remove')
  remove(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ShoppingList> {
    return this.shoppingListsService.remove(request.user.tenantId, id);
  }

  @Post(':id/items')
  addItem(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateShoppingListItemDto,
  ): Promise<ShoppingListItem> {
    return this.shoppingListsService.addItem(request.user.tenantId, id, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateShoppingListItemDto,
  ): Promise<ShoppingListItem> {
    return this.shoppingListsService.updateItem(
      request.user.tenantId,
      id,
      itemId,
      dto,
    );
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<ShoppingListItem> {
    return this.shoppingListsService.removeItem(
      request.user.tenantId,
      id,
      itemId,
    );
  }

  @Post(':id/purchase')
  purchase(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: PurchaseShoppingListDto,
  ): Promise<ShoppingList & { items: ShoppingListItem[] }> {
    return this.shoppingListsService.purchase(
      request.user.userId,
      request.user.tenantId,
      id,
      dto,
    );
  }
}
