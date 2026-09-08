import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { PlannedTransactionAlert } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { PlannedTransactionAlertsService } from './planned-transaction-alerts.service';

@Controller('planned-transactions/alerts')
export class PlannedTransactionAlertsController {
  constructor(
    private readonly alertsService: PlannedTransactionAlertsService,
  ) {}

  @Get()
  findAll(
    @Request() request: AuthenticatedRequest,
    @Query('status') status?: string,
  ): Promise<PlannedTransactionAlert[]> {
    return this.alertsService.findAll(
      request.user.userId,
      request.user.tenantId,
      status,
    );
  }

  @Post(':id/approve')
  approve(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlannedTransactionAlert> {
    return this.alertsService.approve(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }

  @Post(':id/reject')
  reject(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlannedTransactionAlert> {
    return this.alertsService.reject(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }
}
