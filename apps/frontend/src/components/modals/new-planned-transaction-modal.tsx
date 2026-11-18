import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Button, Input, Select, Switch, Field } from '@/components/ui';
import { X, CalendarClock } from 'lucide-react';
import { api } from '@/lib/api';
import {
  buildPlannedTransactionPayload,
  getApiErrorMessage,
  INTERVALS,
  plannedTransactionSchema,
  useAccountsQuery,
  useCategoriesQuery,
  type PlannedTransactionFormData,
} from '@indenance/core';
import { toast } from 'sonner';
import clsx from 'clsx';

interface NewPlannedTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPlannedTransactionModal({ open, onOpenChange }: NewPlannedTransactionModalProps) {
  const { data: accounts = [] } = useAccountsQuery({ enabled: open });

  const { data: categories = [] } = useCategoriesQuery({ enabled: open });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlannedTransactionFormData>({
    resolver: zodResolver(plannedTransactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      accountId: '',
      amount: undefined,
      interval: 'MONTHLY',
      scheduledAt: '',
      occurrences: '',
      categoryId: '',
      requiresApproval: true,
    },
  });

  const type = watch('type');
  const requiresApproval = watch('requiresApproval');
  const accountId = watch('accountId');
  const interval = watch('interval');
  const categoryId = watch('categoryId');

  const onSubmit = async (data: PlannedTransactionFormData) => {
    try {
      await api.post('/planned-transactions', buildPlannedTransactionPayload(data));
      toast.success('Transacción recurrente programada');
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al programar la transacción'));
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
        <Dialog.Popup className="max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <CalendarClock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Dialog.Title>Transacción recurrente</Dialog.Title>
                <Dialog.Description>Programa un gasto o ingreso que se repite</Dialog.Description>
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
                Gasto recurrente
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
                Ingreso recurrente
              </button>
            </div>

            {/* Amount */}
            <Field label="Monto" required error={errors.amount?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-text-muted">$</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="0"
                  {...register('amount')}
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-4 text-xl font-display text-text shadow-xs placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>
            </Field>

            {/* Account */}
            <Field label="Cuenta" required error={errors.accountId?.message}>
              <Select
                value={accountId}
                onValueChange={(val) => setValue('accountId', val, { shouldValidate: true })}
              >
                <Select.Trigger className="w-full">
                  <Select.Value placeholder="Seleccionar cuenta..." />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      <Select.Item value="">
                        Seleccionar cuenta...
                      </Select.Item>
                      {accounts.map((account: { id: string; name: string; currency: string }) => (
                        <Select.Item key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select>
            </Field>

            {/* Frequency + first date */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Frecuencia" required error={errors.interval?.message}>
                <Select
                  value={interval}
                  onValueChange={(val) =>
                    setValue('interval', val as PlannedTransactionFormData['interval'], { shouldValidate: true })
                  }
                >
                  <Select.Trigger className="w-full">
                    <Select.Value />
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
              </Field>

              <Field label="Próxima fecha" error={errors.scheduledAt?.message}>
                <Input type="date" {...register('scheduledAt')} />
              </Field>
            </div>

            {/* Occurrences */}
            <Field
              label="Veces que se repite"
              error={errors.occurrences?.message}
              hint="Déjalo vacío para repetirlo indefinidamente"
            >
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="Indefinido"
                {...register('occurrences')}
              />
            </Field>

            {/* Category */}
            <Field label="Categoría" hint="Opcional">
              <Select
                value={categoryId}
                onValueChange={(val) => setValue('categoryId', val, { shouldValidate: true })}
              >
                <Select.Trigger className="w-full">
                  <Select.Value placeholder="Seleccionar categoría..." />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      <Select.Item value="">
                        Sin categoría
                      </Select.Item>
                      {categories.map((cat: { id: string; name: string }) => (
                        <Select.Item key={cat.id} value={cat.id}>
                          {cat.name}
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select>
            </Field>

            {/* Approval */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised p-3">
              <div>
                <p className="text-sm font-medium text-text">Requiere aprobación</p>
                <p className="text-xs text-text-muted">
                  {requiresApproval
                    ? 'Recibirás una alerta antes de cada ejecución'
                    : 'Se ejecutará automáticamente sin confirmación'}
                </p>
              </div>
              <Switch
                checked={requiresApproval}
                onCheckedChange={(checked) => setValue('requiresApproval', checked)}
              >
                <Switch.Thumb />
              </Switch>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Programar transacción
            </Button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
