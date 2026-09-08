import { useState, useMemo } from 'react';
import { useAccountsQuery } from '@/stores/accounts.store';
import { useTransactionsQuery, type Transaction } from '@/hooks/use-transactions';
import { Select } from '@/components/ui';

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function computeMonthlySpending(transactions: Transaction[]) {
  const months = [2, 1, 0].map((offset) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { label: getMonthLabel(d), key: getMonthKey(d) };
  });

  return months.map(({ label, key }) => {
    const amount = transactions
      .filter((t) => {
        const d = new Date(t.createdAt);
        return getMonthKey(d) === key && t.type === 'EXPENSE';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: label, amount };
  });
}

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
                {month.amount > 0
                  ? `$${(month.amount / 1000).toFixed(1)}k`
                  : '$0'}
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
