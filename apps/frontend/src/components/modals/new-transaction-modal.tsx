import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, Button, Select } from '@/components/ui';
import { X, ArrowRightLeft, Search, Check } from 'lucide-react';
import { api } from '@/lib/api';
import clsx from 'clsx';

const schema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.coerce.number().int().min(1, 'El monto debe ser mayor a 0'),
  accountId: z.string().uuid('Selecciona una cuenta'),
  categoryId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface NewTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTransactionModal({ open, onOpenChange }: NewTransactionModalProps) {
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data),
    enabled: open,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'EXPENSE', amount: 0, accountId: '' },
  });

  const type = watch('type');
  const selectedCategoryId = watch('categoryId');
  const [categorySearch, setCategorySearch] = useState('');

  const filteredCategories = categories.filter((cat: { name: string }) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/transactions', data);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al crear la transacción';
      alert(message);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <ArrowRightLeft className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <Dialog.Title>Nueva transacción</Dialog.Title>
                <Dialog.Description>Registra un ingreso o gasto</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('type', 'EXPENSE', { shouldValidate: true })}
                className={clsx(
                  'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  type === 'EXPENSE'
                    ? 'border-danger-500 bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300'
                    : 'border-border bg-surface-raised text-text-secondary hover:bg-surface',
                )}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'INCOME', { shouldValidate: true })}
                className={clsx(
                  'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  type === 'INCOME'
                    ? 'border-success-500 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300'
                    : 'border-border bg-surface-raised text-text-secondary hover:bg-surface',
                )}
              >
                Ingreso
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-text-muted">$</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="0"
                  {...register('amount')}
                  className="w-full rounded-xl border border-border bg-surface py-3 pl-8 pr-4 text-xl font-display text-text placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-danger-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Cuenta</label>
              <Select
                value={watch('accountId')}
                onValueChange={(val) => setValue('accountId', val, { shouldValidate: true })}
              >
                <Select.Trigger className="w-full">
                  <Select.Value placeholder="Seleccionar cuenta..." />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      {accounts.map((account: { id: string; name: string; currency: string }) => (
                        <Select.Item key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select>
              {errors.accountId && (
                <p className="mt-1 text-xs text-danger-600">{errors.accountId.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Categoría</label>
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <div className="relative border-b border-border">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar categoría..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-1 scrollbar-hidden">
                  {filteredCategories.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-text-muted">No se encontraron categorías</p>
                  ) : (
                    filteredCategories.map((cat: { id: string; name: string }) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setValue('categoryId', cat.id, { shouldValidate: true })}
                        className={clsx(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          selectedCategoryId === cat.id
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                            : 'text-text hover:bg-surface-raised',
                        )}
                      >
                        <div className={clsx(
                          'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                          selectedCategoryId === cat.id
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-neutral-300 dark:border-neutral-600',
                        )}>
                          {selectedCategoryId === cat.id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => setValue('categoryId', undefined, { shouldValidate: true })}
                  className="mt-1.5 text-xs text-text-muted hover:text-danger-600 transition-colors"
                >
                  Limpiar selección
                </button>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Guardar transacción
            </Button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
