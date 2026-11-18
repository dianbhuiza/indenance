import { useState, useMemo } from 'react';
import { useAccountsQuery, useTransactionsQuery, computeCategorySpending, formatCompactAmount } from '@indenance/core';
import { Select } from '@/components/ui';

export function CategoryBreakdown() {
  const { data: accounts = [] } = useAccountsQuery();
  const { transactions } = useTransactionsQuery();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return transactions;
    return transactions.filter((t) => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const { entries, total } = useMemo(() => {
    const computed = computeCategorySpending(filteredTransactions);
    return {
      entries: computed,
      total: computed.reduce((sum, entry) => sum + entry.amount, 0),
    };
  }, [filteredTransactions]);

  let accumulated = 0;
  const gradientStops = entries.map((c) => {
    const start = accumulated;
    accumulated += (c.amount / total) * 360;
    return `${c.color} ${start}deg ${accumulated}deg`;
  });
  const conicGradient =
    entries.length > 0
      ? `conic-gradient(${gradientStops.join(', ')})`
      : 'conic-gradient(#e7e5e4 0deg 360deg)';

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-text">Por categoría</h3>
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

      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-sm text-text-muted">Sin gastos este mes</p>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div className="relative h-28 w-28 flex-shrink-0">
            <div
              className="h-full w-full rounded-full"
              style={{ background: conicGradient }}
            />
            <div className="absolute inset-3 rounded-full bg-surface" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-display text-lg text-text">
                  {formatCompactAmount(total)}
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {entries.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-text-secondary">{c.category}</span>
                </div>
                <span className="font-medium text-text">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
