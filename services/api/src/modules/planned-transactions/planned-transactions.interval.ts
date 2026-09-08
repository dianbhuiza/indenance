import { addDays, addMonths, addWeeks, addYears } from 'date-fns';
import type { Interval } from '../../generated/prisma/client';

export function advanceScheduledAt(
  scheduledAt: Date,
  interval: Interval,
): Date {
  switch (interval) {
    case 'DAILY':
      return addDays(scheduledAt, 1);
    case 'WEEKLY':
      return addWeeks(scheduledAt, 1);
    case 'MONTHLY':
      return addMonths(scheduledAt, 1);
    case 'YEARLY':
      return addYears(scheduledAt, 1);
    default:
      return scheduledAt;
  }
}
