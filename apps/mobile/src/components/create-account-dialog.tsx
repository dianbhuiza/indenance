import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet } from 'lucide-react-native';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { useToast } from '@/components/toast';
import { Button, Dialog, DialogHeader, Input, Select } from '@/components/ui';
import {
  CURRENCIES,
  accountSchema,
  getApiErrorMessage,
  useCreateAccountMutation,
  type AccountFormData,
} from '@indenance/core';

export function CreateAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const createAccount = useCreateAccountMutation();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', currency: '', balance: 0 },
  });

  const selectedCurrency = useWatch({ control, name: 'currency' });

  const close = () => {
    reset();
    createAccount.reset();
    onClose();
  };

  const onSubmit = async (data: AccountFormData) => {
    try {
      await createAccount.mutateAsync({
        name: data.name,
        currency: data.currency,
        balance: data.balance ?? 0,
      });
      toast.success('Cuenta creada exitosamente');
      close();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al crear la cuenta'));
    }
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader
        icon={Wallet}
        iconColor="#0d9488"
        iconBg="rgba(20,184,166,0.16)"
        title="Crear cuenta"
        description="Agrega una cuenta para comenzar"
        onClose={close}
      />

      <View style={{ gap: 16 }}>
        <Input
          label="Nombre de la cuenta"
          placeholder="Ej. Cuenta de nómina, Tarjeta de crédito..."
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Moneda"
          placeholder="Seleccionar moneda..."
          value={selectedCurrency ?? ''}
          error={errors.currency?.message}
          onValueChange={(value) =>
            setValue('currency', value, { shouldValidate: true })
          }
          options={CURRENCIES.map((currency) => ({
            label: currency.label,
            value: currency.code,
          }))}
        />

        <Input
          label="Balance inicial"
          hint="Opcional. Puedes editarlo después."
          prefix="$"
          keyboardType="numeric"
          placeholder="0"
          error={errors.balance?.message}
          {...register('balance')}
        />

        <Button
          size="lg"
          loading={createAccount.isPending}
          onPress={handleSubmit(onSubmit)}
        >
          Crear cuenta
        </Button>
      </View>
    </Dialog>
  );
}
