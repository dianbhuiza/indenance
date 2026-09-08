import { useState, useMemo } from 'react';
import { useAccountsQuery } from '@/stores/accounts.store';
import { useTransactionsQuery, type Transaction } from '@/hooks/use-transactions';
import { Select } from '@/components/ui';

const CATEGORY_COLORS: Record<string, string> = {
  Alimentación: 'var(--color-primary-500)',
  Transporte: 'var(--color-accent-500)',
  Entretenimiento: 'var(--color-violet-500)',
  Salud: 'var(--color-pink-500)',
  Servicios: 'var(--color-amber-500)',
  Educación: 'var(--color-emerald-500)',
  Hogar: 'var(--color-orange-500)',
  Otros: 'var(--color-neutral-400)',
  Salario: 'var(--color-success-500)',
  Freelance: 'var(--color-teal-500)',
};

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function computeCategorySpending(transactions: Transaction[]) {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  const expenses = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return getMonthKey(d) === currentMonthKey && t.type === 'EXPENSE';
  });

  const grouped = new Map<string, number>();
  for (const t of expenses) {
    const cat = t.category?.name ?? 'Sin categoría';
    grouped.set(cat, (grouped.get(cat) ?? 0) + t.amount);
  }

  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return { entries: [], total: 0 };

  const entries = Array.from(grouped.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category] ?? 'var(--color-neutral-400)',
      percentage: Math.round((amount / total) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { entries, total };
}

export function CategoryBreakdown() {
  const { data: accounts = [] } = useAccountsQuery();
  const { transactions } = useTransactionsQuery();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return transactions;
    return transactions.filter((t) => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const { entries, total } = useMemo(
    () => computeCategorySpending(filteredTransactions),
    [filteredTransactions],
  );

  // Build conic gradient for donut
  let accumulated = 0;
  const gradientStops = entries.map((c) => {
    const start = accumulated;
    accumulated += (c.amount / total) * 360;
    return `${c.color} ${start}deg ${accumulated}deg`;
  });
  const conicGradient =
    entries.length > 0
      ? `conic-gradient(${gradientStops.join(', ')})`
      : 'conic-gradient(var(--color-neutral-200) 0deg 360deg)';

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
                  ${(total / 1000).toFixed(1)}k
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
