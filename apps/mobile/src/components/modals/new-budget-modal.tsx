import { zodResolver } from '@hookform/resolvers/zod';
import { PiggyBank } from 'lucide-react-native';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { useToast } from '@/components/toast';
import {
  Button,
  Dialog,
  DialogHeader,
  Input,
  Select,
  SwitchRow,
} from '@/components/ui';
import { api } from '@/lib/api';
import { INTERVALS, getApiErrorMessage, useCategoriesQuery } from '@indenance/core';

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120, 'Muy largo'),
  amount: z.coerce
    .number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser mayor a 0'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export function NewBudgetModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
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
    onClose();
  };

  const onSubmit = async (data: BudgetFormData) => {
    try {
      await api.post('/budgets', {
        name: data.name,
        amount: data.amount,
        ...(categoryId ? { categoryId } : {}),
        ...(isRecurring ? { isRecurring: true, interval } : {}),
      });
      toast.success('Presupuesto creado');
      close();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al crear el presupuesto'));
    }
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader
        icon={PiggyBank}
        iconColor="#7c3aed"
        iconBg="rgba(139,92,246,0.16)"
        title="Nuevo presupuesto"
        description="Establece un límite de gasto mensual"
        onClose={close}
      />

      <View style={{ gap: 16 }}>
        <Input
          label="Nombre"
          placeholder="Ej. Alimentación"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Límite mensual"
          prefix="$"
          keyboardType="numeric"
          placeholder="0"
          error={errors.amount?.message}
          {...register('amount')}
        />

        <Select
          label="Categoría"
          placeholder="Seleccionar categoría..."
          value={categoryId}
          onValueChange={setCategoryId}
          options={[
            { label: 'Sin categoría', value: '' },
            ...categories.map((category) => ({
              label: category.name,
              value: category.id,
            })),
          ]}
        />

        <SwitchRow
          label="Presupuesto recurrente"
          description="Se reinicia automáticamente cada periodo"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />

        {isRecurring && (
          <Select
            label="Frecuencia"
            value={interval}
            onValueChange={setInterval}
            options={INTERVALS.map((entry) => ({
              label: entry.label,
              value: entry.value,
            }))}
          />
        )}

        <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
          Crear presupuesto
        </Button>
      </View>
    </Dialog>
  );
}
