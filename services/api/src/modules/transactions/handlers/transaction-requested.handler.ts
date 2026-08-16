import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Transaction } from '../../../../generated/prisma/client';
import { TRANSACTION_REQUESTED_EVENT } from '../events/transaction-requested.event';
import type { TransactionRequestedPayload } from '../events/transaction-requested.event';
import { TransactionsService } from '../transactions.service';

@Injectable()
export class TransactionRequestedHandler {
  constructor(private readonly transactionsService: TransactionsService) {}

  @OnEvent(TRANSACTION_REQUESTED_EVENT)
  handle(payload: TransactionRequestedPayload): Promise<Transaction> {
    return this.transactionsService.record(
      payload.userId,
      payload.tenantId,
      payload,
    );
  }
}
