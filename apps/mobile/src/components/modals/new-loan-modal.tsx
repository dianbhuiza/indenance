import { zodResolver } from '@hookform/resolvers/zod';
import { HandCoins } from 'lucide-react-native';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

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
  buildLoanPayload,
  computeLoanSummary,
  formatNumber,
  getApiErrorMessage,
  loanSchema,
  toDateString,
  useAccountsQuery,
  useCategoriesQuery,
  type LoanFormData,
} from '@indenance/core';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function NewLoanModal({
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

  const close = () => {
    reset();
    onClose();
  };

  const values = useWatch({ control });

  const interestMode = values.interestMode ?? 'percent';
  const principal = Number(values.principal) || 0;
  const interestPercent = Number(values.interestPercent) || 0;
  const totalRepayment = Number(values.totalRepayment) || 0;
  const installments = Number(values.installments) || 0;
  const recurring = values.recurring ?? false;
  const categoryId = values.categoryId;

  const { total: computedTotal } = computeLoanSummary({
    interestMode,
    principal,
    interestPercent,
    totalRepayment,
  });
  const showSummary =
    principal > 0 && installments >= 1 && computedTotal >= principal;
  const interestAmount = Math.max(computedTotal - principal, 0);

  const onSubmit = async (data: LoanFormData) => {
    try {
      await api.post('/loans', buildLoanPayload(data));
      toast.success('Préstamo creado');
      close();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al crear el préstamo'));
    }
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader
        icon={HandCoins}
        iconColor="#2563eb"
        iconBg="rgba(59,130,246,0.16)"
        title="Nuevo préstamo"
        description="Registra un préstamo con su cronograma de cuotas"
        onClose={close}
      />

      <View style={styles.form}>
        <Input
          label="Nombre"
          hint="Opcional. Ej. Préstamo personal"
          placeholder="Ej. Préstamo personal"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Capital recibido"
          prefix="$"
          keyboardType="numeric"
          placeholder="0"
          error={errors.principal?.message}
          {...register('principal')}
        />

        <Select
          label="Cuenta"
          placeholder="Seleccionar cuenta..."
          error={errors.accountId?.message}
          value={values.accountId ?? ''}
          onValueChange={(value) =>
            setValue('accountId', value, { shouldValidate: true })
          }
          options={accounts.map((account) => ({
            label: `${account.name} (${account.currency})`,
            value: account.id,
          }))}
        />

        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: theme.text }]}>Interés</Text>
          <SegmentedControl
            value={interestMode}
            activeColor="#2563eb"
            onValueChange={(value) =>
              setValue('interestMode', value, { shouldValidate: true })
            }
            options={[
              { label: 'Porcentaje', value: 'percent' },
              { label: 'Total a devolver', value: 'total' },
            ]}
          />
        </View>

        {interestMode === 'percent' ? (
          <Input
            label="Porcentaje de interés"
            hint="Usa 0 si no hay interés"
            suffix="%"
            keyboardType="numeric"
            placeholder="0"
            error={errors.interestPercent?.message}
            {...register('interestPercent')}
          />
        ) : (
          <Input
            label="Total a devolver"
            hint="Capital + interés"
            prefix="$"
            keyboardType="numeric"
            placeholder="0"
            error={errors.totalRepayment?.message}
            {...register('totalRepayment')}
          />
        )}

        {showSummary && (
          <View
            style={[
              styles.summary,
              { backgroundColor: theme.info[50], borderColor: theme.info[200] },
            ]}
          >
            <SummaryRow label="Total a devolver" value={`$${formatNumber(computedTotal)}`} />
            <SummaryRow label="Interés" value={`$${formatNumber(interestAmount)}`} />
            <SummaryRow
              label="Cuota aprox."
              value={`$${formatNumber(Math.floor(computedTotal / installments))}`}
            />
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Input
              label="Cuotas"
              keyboardType="numeric"
              placeholder="12"
              error={errors.installments?.message}
              {...register('installments')}
            />
          </View>
          <View style={styles.rowItem}>
            <Select
              label="Frecuencia"
              value={values.interval}
              onValueChange={(value) =>
                setValue('interval', value as LoanFormData['interval'], {
                  shouldValidate: true,
                })
              }
              options={INTERVALS.map((entry) => ({
                label: entry.label,
                value: entry.value,
              }))}
            />
          </View>
        </View>

        <DateField
          label="Fecha de la primera cuota"
          value={values.startDate ?? ''}
          error={errors.startDate?.message}
          onValueChange={(value) =>
            setValue('startDate', value, { shouldValidate: true })
          }
        />

        <Select
          label="Categoría de las cuotas"
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
            styles.options,
            { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
          ]}
        >
          <SwitchRow
            label="Registrar ingreso del capital"
            description="Crea un ingreso por el dinero recibido"
            checked={values.disburseNow ?? false}
            onCheckedChange={(checked) =>
              setValue('disburseNow', checked, { shouldValidate: true })
            }
          />
          <SwitchRow
            label="Pago recurrente de cuotas"
            description="Programa cada cuota automáticamente"
            checked={recurring}
            onCheckedChange={(checked) =>
              setValue('recurring', checked, { shouldValidate: true })
            }
          />
          {recurring && (
            <SwitchRow
              label="Requiere aprobación"
              description="Recibe una alerta antes de ejecutar cada cuota"
              checked={values.requiresApproval ?? false}
              onCheckedChange={(checked) =>
                setValue('requiresApproval', checked, { shouldValidate: true })
              }
            />
          )}
        </View>

        <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
          Crear préstamo
        </Button>
      </View>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  summary: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  options: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.md,
  },
});
