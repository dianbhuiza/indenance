import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  PlannedTransactionAlert,
  PlannedTransactionAlertStatus,
  Prisma,
  Transaction,
} from '../../generated/prisma/client';
import { assertTenant } from '../shared/assert-tenant';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import {
  TRANSACTION_REQUESTED_EVENT,
  type TransactionRequestedPayload,
} from '../transactions/events/transaction-requested.event';

@Injectable()
export class PlannedTransactionAlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    userId: string,
    tenantId: string | null,
    status?: string,
  ): Promise<PlannedTransactionAlert[]> {
    assertTenant(tenantId);
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException(
        `status must be one of ${validStatuses.join(', ')}`,
      );
    }
    return this.prisma.plannedTransactionAlert.findMany({
      where: {
        tenantId,
        status:
          status && validStatuses.includes(status)
            ? (status as PlannedTransactionAlertStatus)
            : undefined,
        account: { userId },
      },
      include: {
        account: true,
        category: true,
        plannedTransaction: true,
        transaction: true,
      },
      orderBy: { dueAt: 'asc' },
    });
  }

  async approve(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransactionAlert> {
    assertTenant(tenantId);

    return this.txContext.run(() => this.approveWith(userId, tenantId, id));
  }

  private async approveWith(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<PlannedTransactionAlert> {
    const tx = this.txContext.client();

    const claimed = await tx.plannedTransactionAlert.updateMany({
      where: { id, tenantId, status: 'PENDING', account: { userId } },
      data: { status: 'APPROVED', resolvedAt: new Date() },
    });
    if (claimed.count === 0) await this.throwUnclaimable(userId, tenantId, id);

    await this.assertOccurrenceAvailable(tx, id);

    return this.executeAlert(tx, id);
  }

  /**
   * Rejected alerts never consume an occurrence, so the series may still be
   * open. Once the limit of executed occurrences is reached the series is
   * closed and no further alert can be executed.
   */
  private async assertOccurrenceAvailable(
    tx: Prisma.TransactionClient,
    alertId: string,
  ): Promise<void> {
    const alert = await tx.plannedTransactionAlert.findUniqueOrThrow({
      where: { id: alertId },
    });
    const planned = await tx.plannedTransaction.findUnique({
      where: { id: alert.plannedTransactionId },
    });
    if (!planned || planned.occurrences === null) return;
    if (planned.completedOccurrences >= planned.occurrences)
      throw new BadRequestException(
        'The occurrence limit for this recurring payment has been reached',
      );
  }

  /**
   * Turns an APPROVED alert into a real transaction, links it to the alert
   * (and to the loan installment it pays, when it belongs to a loan) and
   * consumes one occurrence of the recurring series, closing it when the
   * configured limit is reached. Callers must run it inside a transaction.
   */
  async executeAlert(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<PlannedTransactionAlert> {
    const alert = await tx.plannedTransactionAlert.findUniqueOrThrow({
      where: { id },
      include: { account: true },
    });

    const payload: TransactionRequestedPayload = {
      userId: alert.account.userId,
      tenantId: alert.tenantId,
      accountId: alert.accountId,
      amount: alert.amount,
      type: alert.type,
      categoryId: alert.categoryId ?? undefined,
    };

    const results = await this.eventEmitter.emitAsync(
      TRANSACTION_REQUESTED_EVENT,
      payload,
    );
    const transaction = results[0] as Transaction | undefined;

    if (!transaction) {
      throw new Error('No handler processed the transaction request');
    }

    if (alert.loanInstallmentId) {
      await tx.loanInstallment.update({
        where: { id: alert.loanInstallmentId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          transactionId: transaction.id,
        },
      });
    }

    const updated = await tx.plannedTransactionAlert.update({
      where: { id },
      data: { transactionId: transaction.id },
    });

    await this.consumeOccurrence(tx, alert.plannedTransactionId);

    return updated;
  }

  /**
   * One executed alert equals one approved occurrence. Only alerts that were
   * rejected never count, so a rejected series keeps firing until the user
   * reaches the configured number of executions.
   */
  private async consumeOccurrence(
    tx: Prisma.TransactionClient,
    plannedTransactionId: string,
  ): Promise<void> {
    const planned = await tx.plannedTransaction.updateMany({
      where: { id: plannedTransactionId, status: 'ACTIVE', deletedAt: null },
      data: { completedOccurrences: { increment: 1 } },
    });
    if (planned.count === 0) return;

    const current = await tx.plannedTransaction.findUnique({
      where: { id: plannedTransactionId },
    });
    if (
      !current ||
      current.occurrences === null ||
      current.completedOccurrences < current.occurrences
    )
      return;

    await tx.plannedTransaction.update({
      where: { id: plannedTransactionId },
      data: { status: 'COMPLETED' },
    });
    await tx.plannedTransactionAlert.updateMany({
      where: { plannedTransactionId, status: 'PENDING' },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
  }

  async reject(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransactionAlert> {
    assertTenant(tenantId);

    const claimed = await this.prisma.plannedTransactionAlert.updateMany({
      where: { id, tenantId, status: 'PENDING', account: { userId } },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
    if (claimed.count === 0) await this.throwUnclaimable(userId, tenantId, id);

    return this.prisma.plannedTransactionAlert.findUniqueOrThrow({
      where: { id },
    });
  }

  /**
   * The conditional claim found no pending alert: either it does not exist,
   * belongs to someone else, or was already resolved by a concurrent request.
   */
  private async throwUnclaimable(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<never> {
    const alert = await this.prisma.plannedTransactionAlert.findFirst({
      where: { id, tenantId, account: { userId } },
    });
    if (!alert) throw new NotFoundException(`Alert with id ${id} not found`);
    throw new BadRequestException(
      `Alert with id ${id} is already ${alert.status.toLowerCase()}`,
    );
  }
}
