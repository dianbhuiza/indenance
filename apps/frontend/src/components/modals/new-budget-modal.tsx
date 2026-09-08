import { Dialog } from '@/components/ui';
import { X, PiggyBank } from 'lucide-react';

interface NewBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBudgetModal({ open, onOpenChange }: NewBudgetModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <PiggyBank className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <Dialog.Title>Nuevo presupuesto</Dialog.Title>
                <Dialog.Description>Establece un límite de gasto mensual</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Categoría</label>
              <select className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors">
                <option>Seleccionar categoría...</option>
                <option>Alimentación</option>
                <option>Transporte</option>
                <option>Entretenimiento</option>
                <option>Salud</option>
                <option>Servicios</option>
                <option>Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Límite mensual</label>
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
              <label className="block text-sm font-medium text-text mb-1.5">Alerta al alcanzar</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="80"
                  defaultValue={80}
                  className="w-20 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text text-center focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
                <span className="text-sm text-text-muted">% del límite</span>
              </div>
            </div>

            <button className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors mt-2">
              Crear presupuesto
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
