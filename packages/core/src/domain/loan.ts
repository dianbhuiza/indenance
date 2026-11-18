import type { LoanFormData } from '../schemas/loan.schema';

export interface LoanSummary {
  total: number;
  interest: number;
}

export function computeLoanSummary(
  data: Pick<
    LoanFormData,
    'interestMode' | 'principal' | 'interestPercent' | 'totalRepayment'
  >,
): LoanSummary {
  const principal = Number(data.principal) || 0;
  const interestPercent = Number(data.interestPercent) || 0;
  const totalRepayment = Number(data.totalRepayment) || 0;

  const total =
    data.interestMode === 'percent'
      ? principal + Math.round((principal * interestPercent) / 100)
      : totalRepayment;

  return { total, interest: Math.max(total - principal, 0) };
}

export function buildLoanPayload(data: LoanFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    accountId: data.accountId,
    principal: data.principal,
    installments: data.installments,
    interval: data.interval,
    disburseNow: data.disburseNow,
  };

  if (data.name) payload.name = data.name;
  if (data.interestMode === 'percent') payload.interestPercent = data.interestPercent ?? 0;
  else payload.totalRepayment = data.totalRepayment;
  if (data.startDate)
    payload.startDate = new Date(`${data.startDate}T12:00:00`).toISOString();
  if (data.categoryId) payload.categoryId = data.categoryId;
  if (data.recurring) payload.recurring = { requiresApproval: data.requiresApproval };

  return payload;
}
