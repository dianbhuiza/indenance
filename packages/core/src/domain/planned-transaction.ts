import type { PlannedTransactionFormData } from '../schemas/planned-transaction.schema';

export function buildPlannedTransactionPayload(
  data: PlannedTransactionFormData,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    accountId: data.accountId,
    amount: data.amount,
    type: data.type,
    isRecurring: true,
    interval: data.interval,
    requiresApproval: data.requiresApproval,
  };

  if (data.scheduledAt) {
    payload.scheduledAt = new Date(`${data.scheduledAt}T12:00:00`).toISOString();
  }
  if (data.occurrences?.trim()) payload.occurrences = Number(data.occurrences);
  if (data.categoryId) payload.categoryId = data.categoryId;

  return payload;
}
