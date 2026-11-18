import { BadRequestException } from '@nestjs/common';
import { addMonths } from 'date-fns';
import { buildInstallmentSchedule, resolveInterest } from './loan-calc';

describe('loan-calc', () => {
  describe('resolveInterest', () => {
    it('derives the total from the percentage', () => {
      expect(
        resolveInterest({ principal: 10000, interestPercent: 12.5 }),
      ).toEqual({
        interestPercent: 12.5,
        interestAmount: 1250,
        totalRepayment: 11250,
      });
    });

    it('derives the percentage from the total to return', () => {
      expect(
        resolveInterest({ principal: 3000, totalRepayment: 3450 }),
      ).toEqual({
        interestPercent: 15,
        interestAmount: 450,
        totalRepayment: 3450,
      });
    });

    it('supports interest free loans', () => {
      expect(resolveInterest({ principal: 5000, interestPercent: 0 })).toEqual({
        interestPercent: 0,
        interestAmount: 0,
        totalRepayment: 5000,
      });
    });

    it('rounds the derived percentage to two decimals', () => {
      expect(
        resolveInterest({ principal: 3000, totalRepayment: 3400 }),
      ).toEqual({
        interestPercent: 13.33,
        interestAmount: 400,
        totalRepayment: 3400,
      });
    });

    it('requires exactly one interest input', () => {
      expect(() => resolveInterest({ principal: 1000 })).toThrow(
        BadRequestException,
      );
      expect(() =>
        resolveInterest({
          principal: 1000,
          interestPercent: 10,
          totalRepayment: 1100,
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects a total below the principal', () => {
      expect(() =>
        resolveInterest({ principal: 1000, totalRepayment: 900 }),
      ).toThrow(BadRequestException);
    });

    it('rejects a percentage outside 0-100', () => {
      expect(() =>
        resolveInterest({ principal: 1000, interestPercent: 150 }),
      ).toThrow(BadRequestException);
    });

    it('rejects a non positive principal', () => {
      expect(() =>
        resolveInterest({ principal: 0, interestPercent: 10 }),
      ).toThrow(BadRequestException);
    });
  });

  describe('buildInstallmentSchedule', () => {
    it('splits the total evenly and pushes the rounding to the last installment', () => {
      const schedule = buildInstallmentSchedule({
        totalRepayment: 1000,
        installments: 3,
        interval: 'MONTHLY',
        startDate: new Date('2026-01-15T00:00:00.000Z'),
      });

      expect(schedule.map((entry) => entry.amount)).toEqual([333, 333, 334]);
      expect(schedule.map((entry) => entry.number)).toEqual([1, 2, 3]);
      expect(schedule.reduce((sum, entry) => sum + entry.amount, 0)).toBe(1000);
    });

    it('spaces the due dates by the given interval', () => {
      const startDate = new Date('2026-01-15T00:00:00.000Z');
      const schedule = buildInstallmentSchedule({
        totalRepayment: 3000,
        installments: 3,
        interval: 'MONTHLY',
        startDate,
      });

      expect(schedule[0].dueAt).toEqual(startDate);
      expect(schedule[1].dueAt).toEqual(addMonths(startDate, 1));
      expect(schedule[2].dueAt).toEqual(addMonths(startDate, 2));
    });

    it('rejects more installments than the total can pay', () => {
      expect(() =>
        buildInstallmentSchedule({
          totalRepayment: 2,
          installments: 3,
          interval: 'MONTHLY',
          startDate: new Date(),
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects a non positive installment count', () => {
      expect(() =>
        buildInstallmentSchedule({
          totalRepayment: 1000,
          installments: 0,
          interval: 'MONTHLY',
          startDate: new Date(),
        }),
      ).toThrow(BadRequestException);
    });
  });
});
