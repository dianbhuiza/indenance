import { z } from 'zod';
import { INTERVAL_VALUES } from '../constants/intervals';

export const plannedTransactionSchema = z
  .object({
    type: z.enum(['EXPENSE', 'INCOME']),
    accountId: z.string().uuid('Selecciona una cuenta'),
    amount: z
      .coerce.number()
      .int('Debe ser un número entero')
      .min(1, 'El monto debe ser mayor a 0'),
    interval: z.enum(INTERVAL_VALUES),
    scheduledAt: z.string().optional(),
    occurrences: z.string().optional(),
    categoryId: z.string().optional(),
    requiresApproval: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.occurrences || data.occurrences.trim() === '') return;
    const value = Number(data.occurrences);
    if (!Number.isInteger(value) || value < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['occurrences'],
        message: 'Debe ser un número entero mayor a 0',
      });
    }
  });

export type PlannedTransactionFormData = z.infer<typeof plannedTransactionSchema>;
