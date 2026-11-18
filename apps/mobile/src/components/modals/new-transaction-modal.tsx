import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft } from 'lucide-react-native';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { useToast } from '@/components/toast';
import {
  Button,
  Dialog,
  DialogHeader,
  Input,
  SegmentedControl,
  Select,
} from '@/components/ui';
import { api } from '@/lib/api';
import {
  getApiErrorMessage,
  transactionSchema,
  useAccountsQuery,
  useCategoriesQuery,
  type TransactionFormData,
} from '@indenance/core';

export function NewTransactionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const { data: accounts = [] } = useAccountsQuery({ enabled: open });
  const { data: categories = [] } = useCategoriesQuery({ enabled: open });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'EXPENSE', amount: 0, accountId: '' },
  });

  const close = () => {
    reset();
    onClose();
  };

  const type = useWatch({ control, name: 'type' });
  const categoryId = useWatch({ control, name: 'categoryId' });
  const accountId = useWatch({ control, name: 'accountId' });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await api.post('/transactions', data);
      toast.success('Transacción guardada');
      close();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al crear la transacción'));
    }
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader
        icon={ArrowRightLeft}
        iconColor="#0d9488"
        iconBg="rgba(20,184,166,0.16)"
        title="Nueva transacción"
        description="Registra un ingreso o gasto"
        onClose={close}
      />

      <View style={{ gap: 16 }}>
        <SegmentedControl
          value={type}
          activeColor={type === 'INCOME' ? '#059669' : '#dc2626'}
          onValueChange={(value) =>
            setValue('type', value, { shouldValidate: true })
          }
          options={[
            { label: 'Gasto', value: 'EXPENSE' },
            { label: 'Ingreso', value: 'INCOME' },
          ]}
        />

        <Input
          label="Monto"
          prefix="$"
          keyboardType="numeric"
          placeholder="0"
          error={errors.amount?.message}
          {...register('amount')}
        />

        <Select
          label="Cuenta"
          placeholder="Seleccionar cuenta..."
          error={errors.accountId?.message}
          value={accountId ?? ''}
          onValueChange={(value) =>
            setValue('accountId', value, { shouldValidate: true })
          }
          options={accounts.map((account) => ({
            label: `${account.name} (${account.currency})`,
            value: account.id,
          }))}
        />

        <Select
          label="Categoría"
          placeholder="Seleccionar categoría..."
          value={categoryId ?? ''}
          onValueChange={(value) =>
            setValue('categoryId', value || undefined, {
              shouldValidate: true,
            })
          }
          options={[
            { label: 'Sin categoría', value: '' },
            ...categories.map((category) => ({
              label: category.name,
              value: category.id,
            })),
          ]}
        />

        <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
          Guardar transacción
        </Button>
      </View>
    </Dialog>
  );
}
