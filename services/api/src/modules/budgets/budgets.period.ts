import type { Interval } from '../../generated/prisma/client';

export interface BudgetPeriod {
  start: Date;
  end: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function budgetPeriod(
  now: Date,
  startDate: Date,
  interval: Interval | null,
): BudgetPeriod {
  if (!interval) {
    return { start: startDate, end: null };
  }

  const delta =
    interval === 'DAILY'
      ? utcCalendarDays(now) - utcCalendarDays(startDate)
      : interval === 'WEEKLY'
        ? Math.floor((utcCalendarDays(now) - utcCalendarDays(startDate)) / 7)
        : interval === 'MONTHLY'
          ? utcMonths(now) - utcMonths(startDate)
          : utcYears(now) - utcYears(startDate);

  const start = advanceUtc(startDate, interval, delta);
  return { start, end: advanceUtc(start, interval, 1) };
}

function advanceUtc(date: Date, interval: Interval, steps: number): Date {
  const d = new Date(date);
  switch (interval) {
    case 'DAILY':
      return new Date(d.getTime() + steps * DAY_MS);
    case 'WEEKLY':
      return new Date(d.getTime() + steps * 7 * DAY_MS);
    case 'MONTHLY': {
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + steps;
      const day = d.getUTCDate();
      const clamped = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      return new Date(
        Date.UTC(
          year,
          month,
          Math.min(day, clamped),
          d.getUTCHours(),
          d.getUTCMinutes(),
          d.getUTCSeconds(),
          d.getUTCMilliseconds(),
        ),
      );
    }
    case 'YEARLY': {
      const year = d.getUTCFullYear() + steps;
      const month = d.getUTCMonth();
      const day = d.getUTCDate();
      const clamped = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      return new Date(
        Date.UTC(
          year,
          month,
          Math.min(day, clamped),
          d.getUTCHours(),
          d.getUTCMinutes(),
          d.getUTCSeconds(),
          d.getUTCMilliseconds(),
        ),
      );
    }
    default:
      return date;
  }
}

function utcCalendarDays(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

function utcMonths(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function utcYears(date: Date): number {
  return date.getUTCFullYear();
}
