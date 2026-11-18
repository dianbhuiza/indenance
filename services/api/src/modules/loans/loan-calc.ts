import { BadRequestException } from '@nestjs/common';
import type { Interval } from '../../generated/prisma/client';
import { advanceScheduledAt } from '../planned-transactions/planned-transactions.interval';

export interface LoanInterestInput {
  principal: number;
  interestPercent?: number | null;
  totalRepayment?: number | null;
}

export interface LoanInterest {
  interestPercent: number | null;
  interestAmount: number;
  totalRepayment: number;
}

export interface LoanInstallmentInput {
  number: number;
  dueAt: Date;
  amount: number;
}

export interface InstallmentScheduleInput {
  totalRepayment: number;
  installments: number;
  interval: Interval;
  startDate: Date;
}

/**
 * Interest is entered in either direction: the percentage of the principal or
 * the total amount to return. Whichever is missing is derived from the other,
 * so both stay in sync. A 0% loan is valid (no interest).
 */
export function resolveInterest(input: LoanInterestInput): LoanInterest {
  const { principal, interestPercent, totalRepayment } = input;

  if (!Number.isInteger(principal) || principal < 1)
    throw new BadRequestException(
      'principal must be an integer greater than 0',
    );

  const hasPercent = interestPercent !== undefined && interestPercent !== null;
  const hasTotal = totalRepayment !== undefined && totalRepayment !== null;
  if (hasPercent === hasTotal)
    throw new BadRequestException(
      'Provide exactly one of interestPercent or totalRepayment',
    );

  if (hasPercent) {
    const percent = interestPercent;
    if (percent < 0 || percent > 100)
      throw new BadRequestException(
        'interestPercent must be between 0 and 100',
      );
    const amount = Math.round((principal * percent) / 100);
    return {
      interestPercent: percent,
      interestAmount: amount,
      totalRepayment: principal + amount,
    };
  }

  const total = totalRepayment as number;
  if (!Number.isInteger(total) || total < principal)
    throw new BadRequestException(
      'totalRepayment must be an integer greater than or equal to the principal',
    );
  const amount = total - principal;
  return {
    interestPercent: Math.round((amount * 10000) / principal) / 100,
    interestAmount: amount,
    totalRepayment: total,
  };
}

/**
 * Even split of the total across the installments: every installment gets the
 * rounded down share and the last one absorbs the rounding difference so the
 * sum matches the total exactly.
 */
export function buildInstallmentSchedule(
  input: InstallmentScheduleInput,
): LoanInstallmentInput[] {
  const { totalRepayment, installments, interval, startDate } = input;

  if (!Number.isInteger(installments) || installments < 1)
    throw new BadRequestException(
      'installments must be an integer greater than 0',
    );
  if (totalRepayment < installments)
    throw new BadRequestException(
      'totalRepayment is too low to pay one unit per installment',
    );

  const base = Math.floor(totalRepayment / installments);
  const remainder = totalRepayment - base * installments;

  const schedule: LoanInstallmentInput[] = [];
  let dueAt = startDate;
  for (let index = 0; index < installments; index += 1) {
    if (index > 0) dueAt = advanceScheduledAt(dueAt, interval);
    schedule.push({
      number: index + 1,
      dueAt,
      amount: base + (index === installments - 1 ? remainder : 0),
    });
  }
  return schedule;
}
