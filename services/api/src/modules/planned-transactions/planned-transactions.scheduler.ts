import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PlannedTransaction } from '../../../generated/prisma/client';
import { AppConfig } from '../../config/app.config';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { advanceScheduledAt } from './planned-transactions.interval';

@Injectable()
export class PlannedTransactionsScheduler implements OnModuleInit {
  private readonly logger = new Logger(PlannedTransactionsScheduler.name);
  private running = false;

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
    private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    const job = new CronJob(this.config.plannedTxCron, () => {
      void this.processDue();
    });
    this.schedulerRegistry.addCronJob('planned-transactions', job);
    job.start();
    this.logger.log(
      `Planned transactions scheduler started with cron '${this.config.plannedTxCron}'`,
    );
  }

  async processDue(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const due = await this.prisma.plannedTransaction.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          scheduledAt: { lte: now },
        },
        take: 100,
        orderBy: { scheduledAt: 'asc' },
      });

      for (const planned of due) {
        await this.raiseAlert(planned);
      }
    } catch (error) {
      this.logger.error('Failed to process due planned transactions', error);
    } finally {
      this.running = false;
    }
  }

  private async raiseAlert(planned: PlannedTransaction): Promise<void> {
    const scheduledAt = planned.scheduledAt;
    const nextScheduledAt =
      planned.isRecurring && planned.interval
        ? advanceScheduledAt(scheduledAt, planned.interval)
        : null;

    const claimed = await this.txContext.run(async () => {
      const result = await this.txContext
        .client()
        .plannedTransaction.updateMany({
          where: {
            id: planned.id,
            scheduledAt,
            deletedAt: null,
            status: 'ACTIVE',
          },
          data: nextScheduledAt
            ? { scheduledAt: nextScheduledAt }
            : { status: 'COMPLETED' },
        });

      if (result.count === 0) return false;

      await this.txContext.client().plannedTransactionAlert.create({
        data: {
          plannedTransactionId: planned.id,
          tenantId: planned.tenantId,
          accountId: planned.accountId,
          amount: planned.amount,
          type: planned.type,
          categoryId: planned.categoryId ?? null,
          dueAt: scheduledAt,
        },
      });
      return true;
    });

    if (!claimed) return;
    this.logger.log(
      `Raised alert for planned transaction ${planned.id} (due ${scheduledAt.toISOString()})`,
    );
  }
}
