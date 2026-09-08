import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  PlannedTransactionAlert,
  PlannedTransactionAlertStatus,
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
        status: status && validStatuses.includes(status) ? (status as PlannedTransactionAlertStatus) : undefined,
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
    const alert = await this.findOnePending(userId, tenantId, id);

    return this.txContext.run(async () => {
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

      return this.txContext.client().plannedTransactionAlert.update({
        where: { id },
        data: {
          status: 'APPROVED',
          transactionId: transaction.id,
          resolvedAt: new Date(),
        },
      });
    });
  }

  async reject(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<PlannedTransactionAlert> {
    assertTenant(tenantId);
    await this.findOnePending(userId, tenantId, id);

    return this.prisma.plannedTransactionAlert.update({
      where: { id },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
  }

  private async findOnePending(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<PlannedTransactionAlert & { account: { userId: string } }> {
    const alert = await this.prisma.plannedTransactionAlert.findFirst({
      where: { id, tenantId, account: { userId } },
      include: { account: true },
    });
    if (!alert) throw new NotFoundException(`Alert with id ${id} not found`);
    if (alert.status !== 'PENDING')
      throw new BadRequestException(
        `Alert with id ${id} is already ${alert.status.toLowerCase()}`,
      );
    return alert;
  }
}
