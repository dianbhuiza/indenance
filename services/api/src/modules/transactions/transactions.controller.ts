import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Transaction } from '../../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.record(
      request.user.userId,
      request.user.tenantId,
      dto,
    );
  }

  @Get()
  findAll(@Request() request: AuthenticatedRequest): Promise<Transaction[]> {
    return this.transactionsService.findAll(
      request.user.userId,
      request.user.tenantId,
    );
  }
}
