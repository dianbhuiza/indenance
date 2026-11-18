import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { PlannedTransaction, Prisma } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app.config';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import { advanceScheduledAt } from './planned-transactions.interval';
import { PlannedTransactionAlertsService } from './planned-transaction-alerts.service';

@Injectable()
export class PlannedTransactionsScheduler implements OnModuleInit {
  private readonly logger = new Logger(PlannedTransactionsScheduler.name);
  private running = false;

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
    private readonly config: AppConfig,
    private readonly alertsService: PlannedTransactionAlertsService,
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
        try {
          await this.raiseAlert(planned);
        } catch (error) {
          this.logger.error(
            `Failed to raise alert for planned transaction ${planned.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to process due planned transactions', error);
    } finally {
      this.running = false;
    }
  }

  private async raiseAlert(planned: PlannedTransaction): Promise<void> {
    const scheduledAt = planned.scheduledAt;
    const nextScheduledAt = this.nextOccurrence(planned, scheduledAt);

    const outcome = await this.txContext.run(() =>
      this.raiseAlertWith(planned, scheduledAt, nextScheduledAt),
    );

    if (outcome === 'completed') {
      this.logger.log(
        `Completed planned transaction ${planned.id} (occurrence limit reached)`,
      );
    } else if (outcome === 'raised') {
      this.logger.log(
        `Raised alert for planned transaction ${planned.id} (due ${scheduledAt.toISOString()})`,
      );
    }
  }

  private async raiseAlertWith(
    planned: PlannedTransaction,
    scheduledAt: Date,
    nextScheduledAt: Date | null,
  ): Promise<'raised' | 'completed' | 'stale'> {
    const tx = this.txContext.client();

    if (this.limitReached(planned)) {
      const closed = await tx.plannedTransaction.updateMany({
        where: {
          id: planned.id,
          scheduledAt,
          deletedAt: null,
          status: 'ACTIVE',
        },
        data: { status: 'COMPLETED' },
      });
      if (closed.count === 0) return 'stale';
      await tx.plannedTransactionAlert.updateMany({
        where: { plannedTransactionId: planned.id, status: 'PENDING' },
        data: { status: 'REJECTED', resolvedAt: new Date() },
      });
      return 'completed';
    }

    const existing = await tx.plannedTransactionAlert.findUnique({
      where: {
        plannedTransactionId_dueAt: {
          plannedTransactionId: planned.id,
          dueAt: scheduledAt,
        },
      },
    });
    if (existing) return 'stale';

    const claimed = await tx.plannedTransaction.updateMany({
      where: { id: planned.id, scheduledAt, deletedAt: null, status: 'ACTIVE' },
      data: nextScheduledAt
        ? { scheduledAt: nextScheduledAt }
        : { status: 'COMPLETED' },
    });
    if (claimed.count === 0) return 'stale';

    const requiresApproval = planned.requiresApproval;
    const alert = await tx.plannedTransactionAlert.create({
      data: {
        plannedTransactionId: planned.id,
        tenantId: planned.tenantId,
        accountId: planned.accountId,
        amount: planned.amount,
        type: planned.type,
        categoryId: planned.categoryId ?? null,
        dueAt: scheduledAt,
        status: requiresApproval ? 'PENDING' : 'APPROVED',
        resolvedAt: requiresApproval ? null : new Date(),
        loanInstallmentId: await this.findLoanInstallmentId(
          tx,
          planned,
          scheduledAt,
        ),
      },
    });

    if (!requiresApproval) {
      await this.alertsService.executeAlert(tx, alert.id);
    }

    return 'raised';
  }

  private limitReached(planned: PlannedTransaction): boolean {
    return (
      planned.occurrences !== null &&
      planned.completedOccurrences >= planned.occurrences
    );
  }

  /**
   * A loan payment occurrence pays the oldest outstanding installment of the
   * loan it belongs to. Occurrences without a loan link (or when every
   * installment is already paid) raise a plain alert.
   */
  private async findLoanInstallmentId(
    tx: Prisma.TransactionClient,
    planned: PlannedTransaction,
    scheduledAt: Date,
  ): Promise<string | null> {
    if (!planned.loanId) return null;
    const installment = await tx.loanInstallment.findFirst({
      where: {
        loanId: planned.loanId,
        status: 'PENDING',
        dueAt: { lte: scheduledAt },
      },
      orderBy: { number: 'asc' },
    });
    return installment?.id ?? null;
  }

  /**
   * Recurring items jump straight to the first occurrence in the future so a
   * long overdue backlog collapses into a single alert instead of raising one
   * alert per cron tick.
   */
  private nextOccurrence(
    planned: PlannedTransaction,
    scheduledAt: Date,
  ): Date | null {
    if (!planned.isRecurring || !planned.interval) return null;

    const now = Date.now();
    let next = advanceScheduledAt(scheduledAt, planned.interval);
    let guard = 0;
    while (next.getTime() <= now && guard < 10_000) {
      const advanced = advanceScheduledAt(next, planned.interval);
      if (advanced.getTime() <= next.getTime()) break;
      next = advanced;
      guard += 1;
    }
    return next;
  }
}
