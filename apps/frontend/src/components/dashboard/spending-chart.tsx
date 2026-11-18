import { useState, useMemo } from 'react';
import { useAccountsQuery, useTransactionsQuery, computeMonthlySpending, formatCompactAmount } from '@indenance/core';
import { Select } from '@/components/ui';

export function SpendingChart() {
  const { data: accounts = [] } = useAccountsQuery();
  const { transactions } = useTransactionsQuery();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return transactions;
    return transactions.filter((t) => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const monthlySpending = useMemo(
    () => computeMonthlySpending(filteredTransactions),
    [filteredTransactions],
  );

  const maxAmount = Math.max(...monthlySpending.map((m) => m.amount), 1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-text">Gastos mensuales</h3>
        {accounts.length > 0 && (
          <Select
            value={selectedAccountId}
            onValueChange={(v) => setSelectedAccountId(String(v))}
          >
            <Select.Trigger className="w-auto min-w-[160px]">
              <Select.Value placeholder="Todas las cuentas" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="">
                    Todas las cuentas
                  </Select.Item>
                  {accounts.map((account) => (
                    <Select.Item key={account.id} value={account.id}>
                      {account.name}
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select>
        )}
      </div>

      <div className="flex items-end gap-3" style={{ height: 140 }}>
        {monthlySpending.map((month, i) => {
          const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
          const isHighest = month.amount === maxAmount && month.amount > 0;

          return (
            <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">
                {formatCompactAmount(month.amount)}
              </span>
              <div className="relative w-full" style={{ height: 100 }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 animate-chart-grow stagger-${i + 1} ${
                    isHighest
                      ? 'bg-gradient-to-t from-primary-600 to-primary-400'
                      : 'bg-gradient-to-t from-neutral-200 to-neutral-100 dark:from-neutral-700 dark:to-neutral-600'
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-muted">{month.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
