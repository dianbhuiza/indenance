import type { CreateTransactionDto } from '../dto/create-transaction.dto';

export const TRANSACTION_REQUESTED_EVENT = 'transaction.requested';

export interface TransactionRequestedPayload extends CreateTransactionDto {
  userId: string;
  tenantId: string;
}
