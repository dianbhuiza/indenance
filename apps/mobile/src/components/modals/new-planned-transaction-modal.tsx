import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock } from 'lucide-react-native';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/toast';
import {
  Button,
  DateField,
  Dialog,
  DialogHeader,
  Input,
  SegmentedControl,
  Select,
  SwitchRow,
} from '@/components/ui';
import { api } from '@/lib/api';
import {
  INTERVALS,
  buildPlannedTransactionPayload,
  getApiErrorMessage,
  plannedTransactionSchema,
  useAccountsQuery,
  useCategoriesQuery,
  type PlannedTransactionFormData,
} from '@indenance/core';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function NewPlannedTransactionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
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

  const close = () => {
    reset();
    onClose();
  };

  const values = useWatch({ control });

  const type = values.type ?? 'EXPENSE';
  const requiresApproval = values.requiresApproval ?? false;
  const accountId = values.accountId ?? '';
  const interval = values.interval ?? 'MONTHLY';
  const categoryId = values.categoryId;

  const onSubmit = async (data: PlannedTransactionFormData) => {
    try {
      await api.post(
        '/planned-transactions',
        buildPlannedTransactionPayload(data),
      );
      toast.success('Transacción recurrente programada');
      close();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al programar la transacción'));
    }
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader
        icon={CalendarClock}
        iconColor="#d97706"
        iconBg="rgba(245,158,11,0.16)"
        title="Transacción recurrente"
        description="Programa un gasto o ingreso que se repite"
        onClose={close}
      />

      <View style={styles.form}>
        <SegmentedControl
          value={type}
          activeColor={type === 'INCOME' ? '#059669' : '#dc2626'}
          onValueChange={(value) =>
            setValue('type', value, { shouldValidate: true })
          }
          options={[
            { label: 'Gasto recurrente', value: 'EXPENSE' },
            { label: 'Ingreso recurrente', value: 'INCOME' },
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
          value={accountId}
          onValueChange={(value) =>
            setValue('accountId', value, { shouldValidate: true })
          }
          options={accounts.map((account) => ({
            label: `${account.name} (${account.currency})`,
            value: account.id,
          }))}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Select
              label="Frecuencia"
              error={errors.interval?.message}
              value={interval}
              onValueChange={(value) =>
                setValue(
                  'interval',
                  value as PlannedTransactionFormData['interval'],
                  { shouldValidate: true },
                )
              }
              options={INTERVALS.map((entry) => ({
                label: entry.label,
                value: entry.value,
              }))}
            />
          </View>
          <View style={styles.rowItem}>
            <DateField
              label="Próxima fecha"
              value={values.scheduledAt ?? ''}
              error={errors.scheduledAt?.message}
              onValueChange={(value) =>
                setValue('scheduledAt', value, { shouldValidate: true })
              }
            />
          </View>
        </View>

        <Input
          label="Veces que se repite"
          hint="Déjalo vacío para repetirlo indefinidamente"
          keyboardType="numeric"
          placeholder="Indefinido"
          error={errors.occurrences?.message}
          {...register('occurrences')}
        />

        <Select
          label="Categoría"
          hint="Opcional"
          placeholder="Seleccionar categoría..."
          value={categoryId ?? ''}
          onValueChange={(value) =>
            setValue('categoryId', value || undefined, { shouldValidate: true })
          }
          options={[
            { label: 'Sin categoría', value: '' },
            ...categories.map((category) => ({
              label: category.name,
              value: category.id,
            })),
          ]}
        />

        <View
          style={[
            styles.approval,
            { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
          ]}
        >
          <SwitchRow
            label="Requiere aprobación"
            description={
              requiresApproval
                ? 'Recibirás una alerta antes de cada ejecución'
                : 'Se ejecutará automáticamente sin confirmación'
            }
            checked={requiresApproval}
            onCheckedChange={(checked) =>
              setValue('requiresApproval', checked, { shouldValidate: true })
            }
          />
        </View>

        <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
          Programar transacción
        </Button>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  approval: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
});
