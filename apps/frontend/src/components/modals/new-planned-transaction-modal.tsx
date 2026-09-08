import { Dialog } from '@/components/ui';
import { X, CalendarClock } from 'lucide-react';

interface NewPlannedTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPlannedTransactionModal({ open, onOpenChange }: NewPlannedTransactionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <CalendarClock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Dialog.Title>Transacción planeada</Dialog.Title>
                <Dialog.Description>Programa un gasto o ingreso futuro</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-xl border-2 border-primary-500 bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                Gasto recurrente
              </button>
              <button className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface transition-colors">
                Ingreso recurrente
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Descripción</label>
              <input
                type="text"
                placeholder="Ej. Renta mensual"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-surface py-2.5 pl-7 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Frecuencia</label>
              <select className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors">
                <option>Semanal</option>
                <option>Quincenal</option>
                <option selected>Mensual</option>
                <option>Trimestral</option>
                <option>Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Próxima fecha</label>
              <input
                type="date"
                defaultValue="2026-10-01"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            <button className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors mt-2">
              Programar transacción
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
