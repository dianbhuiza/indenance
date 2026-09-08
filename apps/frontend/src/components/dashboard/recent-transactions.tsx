import { useTransactionsQuery } from '@/hooks/use-transactions';
import { ArrowRight } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  Alimentación: '🛒',
  Transporte: '🚗',
  Entretenimiento: '🎬',
  Salud: '💊',
  Servicios: '📱',
  Educación: '📚',
  Hogar: '🏠',
  Otros: '📌',
  Salario: '💰',
  Freelance: '💻',
  'Sin categoría': '📌',
};

function getFormattedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function RecentTransactions() {
  const { transactions } = useTransactionsQuery();

  const recent = transactions.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 font-display text-lg text-text">Transacciones recientes</h3>
        <p className="py-4 text-center text-sm text-text-muted">
          Aún no hay transacciones
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-text">Transacciones recientes</h3>
        <button className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
          Ver todo
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-1">
        {recent.map((tx, i) => {
          const icon = CATEGORY_ICONS[tx.category?.name ?? 'Sin categoría'] ?? '📌';
          return (
            <div
              key={tx.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-raised stagger-${i + 1} animate-fade-in`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised text-lg">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {tx.category?.name ?? 'Sin categoría'}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-text-muted">{tx.account.name}</p>
                  <span className="text-[10px] text-text-muted">·</span>
                  <p className="text-xs text-text-muted">{getFormattedDate(tx.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    tx.type === 'INCOME' ? 'text-success-600' : 'text-text'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-text-muted">{tx.account.currency}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
