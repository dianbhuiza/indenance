import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, Button, Input, Field } from '@/components/ui';
import { useCreateAccountMutation } from '@/stores/accounts.store';
import { toast } from 'sonner';
import { Wallet, X } from 'lucide-react';

const CURRENCIES = [
  { code: 'MXN', label: 'Peso mexicano (MXN)' },
  { code: 'USD', label: 'Dólar estadounidense (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'COP', label: 'Peso colombiano (COP)' },
  { code: 'ARS', label: 'Peso argentino (ARS)' },
  { code: 'CLP', label: 'Peso chileno (CLP)' },
  { code: 'PEN', label: 'Sol peruano (PEN)' },
  { code: 'BRL', label: 'Real brasileño (BRL)' },
  { code: 'GTQ', label: 'Quetzal guatemalteco (GTQ)' },
  { code: 'HNL', label: 'Lempira hondureño (HNL)' },
  { code: 'NIO', label: 'Córdoba nicaragüense (NIO)' },
  { code: 'CRC', label: 'Colón costarricense (CRC)' },
  { code: 'PAB', label: 'Balboa panameño (PAB)' },
  { code: 'VES', label: 'Bolívar venezolano (VES)' },
  { code: 'UYU', label: 'Peso uruguayo (UYU)' },
  { code: 'PYG', label: 'Guaraní paraguayo (PYG)' },
  { code: 'BOB', label: 'Boliviano (BOB)' },
];

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120, 'Muy largo'),
  currency: z.string().min(1, 'Selecciona una moneda'),
  balance: z.coerce.number().int('Debe ser un número entero').optional(),
});

type FormData = z.infer<typeof schema>;

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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', currency: '', balance: 0 },
  });

  const selectedCurrency = watch('currency');

  const onSubmit = async (data: FormData) => {
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
