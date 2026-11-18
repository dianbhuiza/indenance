import { z } from 'zod';
import { INTERVAL_VALUES } from '../constants/intervals';

export const loanSchema = z
  .object({
    name: z.string().trim().max(80, 'Muy largo').optional(),
    accountId: z.string().uuid('Selecciona una cuenta'),
    principal: z
      .coerce.number()
      .int('Debe ser un número entero')
      .min(1, 'El capital debe ser mayor a 0'),
    interestMode: z.enum(['percent', 'total']),
    interestPercent: z.coerce.number().optional(),
    totalRepayment: z.coerce.number().optional(),
    installments: z
      .coerce.number()
      .int('Debe ser un número entero')
      .min(1, 'Debe ser al menos 1 cuota'),
    interval: z.enum(INTERVAL_VALUES),
    startDate: z.string().optional(),
    categoryId: z.string().optional(),
    disburseNow: z.boolean(),
    recurring: z.boolean(),
    requiresApproval: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.interestMode === 'percent') {
      if (
        data.interestPercent == null ||
        data.interestPercent < 0 ||
        data.interestPercent > 100
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['interestPercent'],
          message: 'Ingresa un porcentaje entre 0 y 100',
        });
      }
      return;
    }
    if (!data.totalRepayment || !Number.isInteger(data.totalRepayment)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalRepayment'],
        message: 'Ingresa el total a devolver',
      });
    } else if (data.totalRepayment < data.principal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalRepayment'],
        message: 'Debe ser mayor o igual al capital recibido',
      });
    }
  });

export type LoanFormData = z.infer<typeof loanSchema>;
