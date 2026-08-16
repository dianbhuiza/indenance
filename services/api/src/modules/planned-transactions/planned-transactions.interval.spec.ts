import { advanceScheduledAt } from './planned-transactions.interval';

describe('advanceScheduledAt', () => {
  it('advances a day', () => {
    const date = new Date('2026-08-15T10:00:00.000Z');
    expect(advanceScheduledAt(date, 'DAILY')).toEqual(
      new Date('2026-08-16T10:00:00.000Z'),
    );
  });

  it('advances a week', () => {
    const date = new Date('2026-08-15T10:00:00.000Z');
    expect(advanceScheduledAt(date, 'WEEKLY')).toEqual(
      new Date('2026-08-22T10:00:00.000Z'),
    );
  });

  it('advances a month respecting the end of month', () => {
    const date = new Date('2026-01-31T10:00:00.000Z');
    expect(advanceScheduledAt(date, 'MONTHLY')).toEqual(
      new Date('2026-02-28T10:00:00.000Z'),
    );
  });

  it('advances a year', () => {
    const date = new Date('2026-08-15T10:00:00.000Z');
    expect(advanceScheduledAt(date, 'YEARLY')).toEqual(
      new Date('2027-08-15T10:00:00.000Z'),
    );
  });
});
