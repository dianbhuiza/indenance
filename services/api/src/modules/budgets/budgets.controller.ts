import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import type { Budget } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { BudgetsService, type BudgetWithUsage } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateBudgetDto,
  ): Promise<Budget> {
    return this.budgetsService.create(request.user.tenantId, dto);
  }

  @Get()
  findAll(
    @Request() request: AuthenticatedRequest,
  ): Promise<BudgetWithUsage[]> {
    return this.budgetsService.findAll(request.user.tenantId);
  }

  @Get(':id')
  findOne(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BudgetWithUsage> {
    return this.budgetsService.findOne(request.user.tenantId, id);
  }

  @Patch(':id')
  update(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<Budget> {
    return this.budgetsService.update(request.user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Budget> {
    return this.budgetsService.remove(request.user.tenantId, id);
  }
}
