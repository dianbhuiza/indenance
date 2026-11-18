import { useAccountsQuery } from '@indenance/core';
import React from 'react';

import { Select } from '@/components/ui';

export function AccountFilter({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const { data: accounts = [] } = useAccountsQuery();

  if (accounts.length === 0) return null;

  return (
    <Select
      placeholder="Todas las cuentas"
      value={value}
      onValueChange={onValueChange}
      options={[
        { label: 'Todas las cuentas', value: '' },
        ...accounts.map((account) => ({
          label: account.name,
          value: account.id,
        })),
      ]}
    />
  );
}
