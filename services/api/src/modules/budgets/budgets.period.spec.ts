import { budgetPeriod } from './budgets.period';

describe('budgetPeriod', () => {
  const startDate = new Date('2026-01-15T00:00:00.000Z');

  it('returns the full window for non recurring budgets', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');

    expect(budgetPeriod(now, startDate, null)).toEqual({
      start: startDate,
      end: null,
    });
  });

  it('caps the window at endDate for non recurring budgets', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    const endDate = new Date('2026-03-01T00:00:00.000Z');

    expect(budgetPeriod(now, startDate, null, endDate)).toEqual({
      start: startDate,
      end: endDate,
    });
  });

  it('returns the period containing now for recurring budgets', () => {
    const now = new Date('2026-03-20T00:00:00.000Z');

    expect(budgetPeriod(now, startDate, 'MONTHLY')).toEqual({
      start: new Date('2026-03-15T00:00:00.000Z'),
      end: new Date('2026-04-15T00:00:00.000Z'),
    });
  });

  it('never looks at a period before the budget starts', () => {
    const futureStart = new Date('2026-06-01T00:00:00.000Z');
    const now = new Date('2026-05-01T00:00:00.000Z');

    const period = budgetPeriod(now, futureStart, 'MONTHLY');

    expect(period.start).toEqual(futureStart);
  });

  it('clamps a recurring period to the budget endDate', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    const endDate = new Date('2026-04-01T00:00:00.000Z');

    const period = budgetPeriod(now, startDate, 'MONTHLY', endDate);

    expect(period.end).toEqual(endDate);
    expect(period.start.getTime()).toBeLessThan(period.end!.getTime());
  });
});
