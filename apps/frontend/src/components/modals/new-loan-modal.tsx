import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Button, Input, Select, Switch, Field } from '@/components/ui';
import { X, HandCoins } from 'lucide-react';
import { api } from '@/lib/api';
import {
  buildLoanPayload,
  computeLoanSummary,
  formatNumber,
  getApiErrorMessage,
  INTERVALS,
  loanSchema,
  toDateString,
  useAccountsQuery,
  useCategoriesQuery,
  type LoanFormData,
} from '@indenance/core';
import { toast } from 'sonner';
import clsx from 'clsx';

interface NewLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLoanModal({ open, onOpenChange }: NewLoanModalProps) {
  const { data: accounts = [] } = useAccountsQuery({ enabled: open });

  const { data: categories = [] } = useCategoriesQuery({ enabled: open });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: '',
      accountId: '',
      principal: undefined,
      interestMode: 'percent',
      interestPercent: undefined,
      totalRepayment: undefined,
      installments: 12,
      interval: 'MONTHLY',
      startDate: toDateString(new Date()),
      categoryId: '',
      disburseNow: true,
      recurring: true,
      requiresApproval: true,
    },
  });

  const interestMode = watch('interestMode');
  const principal = Number(watch('principal')) || 0;
  const interestPercent = Number(watch('interestPercent')) || 0;
  const totalRepayment = Number(watch('totalRepayment')) || 0;
  const installments = Number(watch('installments')) || 0;
  const recurring = watch('recurring');
  const categoryId = watch('categoryId');

  const { total: computedTotal } = computeLoanSummary({
    interestMode,
    principal,
    interestPercent,
    totalRepayment,
  });
  const showSummary = principal > 0 && installments >= 1 && computedTotal >= principal;
  const interestAmount = Math.max(computedTotal - principal, 0);

  const onSubmit = async (data: LoanFormData) => {
    try {
      await api.post('/loans', buildLoanPayload(data));
      toast.success('Préstamo creado');
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al crear el préstamo'));
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-100 dark:bg-info-900/30">
                <HandCoins className="h-5 w-5 text-info-600" />
              </div>
              <div>
                <Dialog.Title>Nuevo préstamo</Dialog.Title>
                <Dialog.Description>Registra un préstamo con su cronograma de cuotas</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field label="Nombre" hint="Opcional. Ej. Préstamo personal">
              <Input placeholder="Ej. Préstamo personal" {...register('name')} />
            </Field>

            {/* Capital */}
            <Field label="Capital recibido" required error={errors.principal?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-text-muted">$</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="0"
                  {...register('principal')}
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-4 text-xl font-display text-text shadow-xs placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>
            </Field>

            {/* Account */}
            <Field label="Cuenta" required error={errors.accountId?.message}>
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

            {/* Interest mode */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Interés</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('interestMode', 'percent', { shouldValidate: true })}
                  className={clsx(
                    'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                    interestMode === 'percent'
                      ? 'border-info-500 bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-300'
                      : 'border-border bg-surface-raised text-text-secondary hover:bg-surface',
                  )}
                >
                  Porcentaje
                </button>
                <button
                  type="button"
                  onClick={() => setValue('interestMode', 'total', { shouldValidate: true })}
                  className={clsx(
                    'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                    interestMode === 'total'
                      ? 'border-info-500 bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-300'
                      : 'border-border bg-surface-raised text-text-secondary hover:bg-surface',
                  )}
                >
                  Total a devolver
                </button>
              </div>
            </div>

            {interestMode === 'percent' ? (
              <Field
                label="Porcentaje de interés"
                required
                error={errors.interestPercent?.message}
                hint="Usa 0 si no hay interés"
              >
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    placeholder="0"
                    {...register('interestPercent')}
                    className="w-full rounded-lg border border-border bg-surface py-2 pl-3 pr-8 text-sm text-text shadow-xs placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
                </div>
              </Field>
            ) : (
              <Field
                label="Total a devolver"
                required
                error={errors.totalRepayment?.message}
                hint="Capital + interés"
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="0"
                    {...register('totalRepayment')}
                    className="w-full rounded-lg border border-border bg-surface py-2 pl-7 pr-4 text-sm text-text shadow-xs placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  />
                </div>
              </Field>
            )}

            {/* Summary */}
            {showSummary && (
              <div className="rounded-xl border border-info-200 bg-info-50 p-3 text-sm dark:border-info-800 dark:bg-info-900/20">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Total a devolver</span>
                  <span className="font-medium text-text">${formatNumber(computedTotal)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-text-secondary">
                  <span>Interés</span>
                  <span className="font-medium text-text">${formatNumber(interestAmount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-text-secondary">
                  <span>Cuota aprox.</span>
                  <span className="font-medium text-text">
                    ${formatNumber(Math.floor(computedTotal / installments))}
                  </span>
                </div>
              </div>
            )}

            {/* Installments + interval */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cuotas" required error={errors.installments?.message}>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="12"
                  {...register('installments')}
                />
              </Field>
              <Field label="Frecuencia" required error={errors.interval?.message}>
                <Select
                  value={watch('interval')}
                  onValueChange={(val) =>
                    setValue('interval', val as LoanFormData['interval'], { shouldValidate: true })
                  }
                >
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner>
                      <Select.Popup>
                        {INTERVALS.map((interval) => (
                          <Select.Item key={interval.value} value={interval.value}>
                            {interval.label}
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select>
              </Field>
            </div>

            <Field label="Fecha de la primera cuota" error={errors.startDate?.message}>
              <Input type="date" {...register('startDate')} />
            </Field>

            {/* Category */}
            <Field label="Categoría de las cuotas" hint="Opcional">
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

            {/* Options */}
            <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">Registrar ingreso del capital</p>
                  <p className="text-xs text-text-muted">Crea un ingreso por el dinero recibido</p>
                </div>
                <Switch
                  checked={watch('disburseNow')}
                  onCheckedChange={(checked) => setValue('disburseNow', checked)}
                >
                  <Switch.Thumb />
                </Switch>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">Pago recurrente de cuotas</p>
                  <p className="text-xs text-text-muted">Programa cada cuota automáticamente</p>
                </div>
                <Switch
                  checked={recurring}
                  onCheckedChange={(checked) => setValue('recurring', checked)}
                >
                  <Switch.Thumb />
                </Switch>
              </div>

              {recurring && (
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-sm font-medium text-text">Requiere aprobación</p>
                    <p className="text-xs text-text-muted">
                      Recibe una alerta antes de ejecutar cada cuota
                    </p>
                  </div>
                  <Switch
                    checked={watch('requiresApproval')}
                    onCheckedChange={(checked) => setValue('requiresApproval', checked)}
                  >
                    <Switch.Thumb />
                  </Switch>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Crear préstamo
            </Button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
