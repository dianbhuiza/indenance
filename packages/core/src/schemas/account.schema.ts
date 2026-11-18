import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120, 'Muy largo'),
  currency: z.string().min(1, 'Selecciona una moneda'),
  balance: z.coerce.number().int('Debe ser un número entero').optional(),
});

export type AccountFormData = z.infer<typeof accountSchema>;
