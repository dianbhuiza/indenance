import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PlannedTransactionAlert } from '../../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PlannedTransactionAlertsService } from './planned-transaction-alerts.service';

@Controller('planned-transactions/alerts')
@UseGuards(AuthGuard)
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
    @Param('id') id: string,
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
    @Param('id') id: string,
  ): Promise<PlannedTransactionAlert> {
    return this.alertsService.reject(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }
}
