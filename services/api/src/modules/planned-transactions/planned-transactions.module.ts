import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlannedTransactionAlertsController } from './planned-transaction-alerts.controller';
import { PlannedTransactionAlertsService } from './planned-transaction-alerts.service';
import { PlannedTransactionsController } from './planned-transactions.controller';
import { PlannedTransactionsScheduler } from './planned-transactions.scheduler';
import { PlannedTransactionsService } from './planned-transactions.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PlannedTransactionsController,
    PlannedTransactionAlertsController,
  ],
  providers: [
    PlannedTransactionsService,
    PlannedTransactionAlertsService,
    PlannedTransactionsScheduler,
  ],
})
export class PlannedTransactionsModule {}
