import { useAccountsQuery } from '@/stores/accounts.store';
import { Wallet } from 'lucide-react';

export function BalanceCard() {
  const { data: accounts = [] } = useAccountsQuery();
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-white shadow-lg noise-bg">
      <div className="relative z-10">
        <p className="text-sm font-medium text-primary-200">Balance total</p>
        <p className="mt-1 font-display text-4xl tracking-tight">
          ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {accounts.length > 0 && (
        <div className="relative z-10 mt-5 space-y-2 border-t border-white/10 pt-4">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm text-primary-100">{account.name}</span>
              </div>
              <span className="text-sm font-medium tabular-nums">
                ${account.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                <span className="ml-1 text-[10px] text-primary-300">{account.currency}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5" />
    </div>
  );
}
