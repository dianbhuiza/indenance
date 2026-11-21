import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Button, Select, Switch, Input } from '@/components/ui';
import { X, PiggyBank } from 'lucide-react';
import { z } from 'zod';
import { api } from '@/lib/api';
import {
  getApiErrorMessage,
  useCategoriesQuery,
  INTERVALS,
} from '@indenance/core';

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120, 'Muy largo'),
  amount: z.coerce.number().int('Debe ser un número entero').min(1, 'Debe ser mayor a 0'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface NewBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBudgetModal({ open, onOpenChange }: NewBudgetModalProps) {
  const { data: categories = [] } = useCategoriesQuery({ enabled: open });
  const [categoryId, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState('MONTHLY');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { name: '', amount: 0 },
  });

  const close = () => {
    reset();
    setCategoryId('');
    setIsRecurring(false);
    onOpenChange(false);
  };

  const onSubmit = async (data: BudgetFormData) => {
    try {
      await api.post('/budgets', {
        name: data.name,
        amount: data.amount,
        ...(categoryId ? { categoryId } : {}),
        ...(isRecurring ? { isRecurring: true, interval } : {}),
      });
      close();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Error al crear el presupuesto'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); else onOpenChange(true); }}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <PiggyBank className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <Dialog.Title>Nuevo presupuesto</Dialog.Title>
                <Dialog.Description>Establece un límite de gasto</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Nombre</label>
              <Input placeholder="Ej. Alimentación" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Límite</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="0"
                  {...register('amount')}
                  className="w-full rounded-xl border border-border bg-surface py-2.5 pl-7 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-danger-600">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Categoría</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <Select.Trigger className="w-full">
                  <Select.Value placeholder="Sin categoría" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      <Select.Item value="">Sin categoría</Select.Item>
                      {categories.map((category: { id: string; name: string }) => (
                        <Select.Item key={category.id} value={category.id}>
                          {category.name}
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">Presupuesto recurrente</span>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Frecuencia</label>
                <Select value={interval} onValueChange={setInterval}>
                  <Select.Trigger className="w-full">
                    <Select.Value placeholder="Mensual" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner>
                      <Select.Popup>
                        {INTERVALS.map((entry) => (
                          <Select.Item key={entry.value} value={entry.value}>
                            {entry.label}
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Crear presupuesto
            </Button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}

export default NewBudgetModal;
