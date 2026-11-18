import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Button, Input, Field } from '@/components/ui';
import { useCreateAccountMutation, CURRENCIES, accountSchema, type AccountFormData } from '@indenance/core';
import { toast } from 'sonner';
import { Wallet, X } from 'lucide-react';

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAccountDialog({ open, onOpenChange }: CreateAccountDialogProps) {
  const createAccount = useCreateAccountMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', currency: '', balance: 0 },
  });

  const selectedCurrency = watch('currency');

  const onSubmit = async (data: AccountFormData) => {
    await createAccount.mutateAsync({
      name: data.name,
      currency: data.currency,
      balance: data.balance ?? 0,
    });
    toast.success('Cuenta creada exitosamente');
    reset();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      createAccount.reset();
    }
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
                <Wallet className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <Dialog.Title>Crear cuenta</Dialog.Title>
                <Dialog.Description>Agrega una cuenta para comenzar</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field label="Nombre de la cuenta" required error={errors.name?.message}>
              <Input
                placeholder="Ej. Cuenta de nómina, Tarjeta de crédito..."
                {...register('name')}
              />
            </Field>

            <Field label="Moneda" required error={errors.currency?.message}>
              <select
                value={selectedCurrency}
                onChange={(e) => setValue('currency', e.target.value, { shouldValidate: true })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-xs focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              >
                <option value="">Seleccionar moneda...</option>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Balance inicial" hint="Opcional. Puedes editarlo después.">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                <input
                  type="number"
                  step={1}
                  placeholder="0"
                  {...register('balance')}
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-7 pr-4 text-sm text-text shadow-xs placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>
            </Field>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={createAccount.isPending}
            >
              Crear cuenta
            </Button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
