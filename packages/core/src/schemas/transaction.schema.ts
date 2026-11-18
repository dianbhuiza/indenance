import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.coerce.number().int().min(1, 'El monto debe ser mayor a 0'),
  accountId: z.string().uuid('Selecciona una cuenta'),
  categoryId: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
