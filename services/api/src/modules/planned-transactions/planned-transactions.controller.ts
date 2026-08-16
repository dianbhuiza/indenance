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
import { PlannedTransaction } from '../../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreatePlannedTransactionDto } from './dto/create-planned-transaction.dto';
import { UpdatePlannedTransactionDto } from './dto/update-planned-transaction.dto';
import { PlannedTransactionsService } from './planned-transactions.service';

@Controller('planned-transactions')
@UseGuards(AuthGuard)
export class PlannedTransactionsController {
  constructor(
    private readonly plannedTransactionsService: PlannedTransactionsService,
  ) {}

  @Post()
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreatePlannedTransactionDto,
  ): Promise<PlannedTransaction> {
    return this.plannedTransactionsService.create(
      request.user.userId,
      request.user.tenantId,
      dto,
    );
  }

  @Get()
  findAll(
    @Request() request: AuthenticatedRequest,
    @Query('status') status?: string,
  ): Promise<PlannedTransaction[]> {
    return this.plannedTransactionsService.findAll(
      request.user.userId,
      request.user.tenantId,
      status,
    );
  }

  @Get(':id')
  findOne(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<PlannedTransaction> {
    return this.plannedTransactionsService.findOne(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }

  @Patch(':id')
  update(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlannedTransactionDto,
  ): Promise<PlannedTransaction> {
    return this.plannedTransactionsService.update(
      request.user.userId,
      request.user.tenantId,
      id,
      dto,
    );
  }

  @Delete(':id')
  softDelete(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<PlannedTransaction> {
    return this.plannedTransactionsService.softDelete(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }

  @Delete(':id/remove')
  remove(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<PlannedTransaction> {
    return this.plannedTransactionsService.remove(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }
}
