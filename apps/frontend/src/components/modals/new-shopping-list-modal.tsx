import { Dialog } from '@/components/ui';
import { X, ShoppingCart, Plus } from 'lucide-react';

interface NewShoppingListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewShoppingListModal({ open, onOpenChange }: NewShoppingListModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30">
                <ShoppingCart className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <Dialog.Title>Nueva lista de compra</Dialog.Title>
                <Dialog.Description>Crea una lista para organizar tus compras</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Nombre de la lista</label>
              <input
                type="text"
                placeholder="Ej. Compra semanal"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Presupuesto estimado</label>
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
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-text">Artículos</label>
                <button className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-surface-raised p-6 text-center">
                <p className="text-sm text-text-muted">Agrega artículos a tu lista</p>
              </div>
            </div>

            <button className="w-full rounded-xl bg-accent-600 py-3 text-sm font-semibold text-white hover:bg-accent-700 transition-colors mt-2">
              Crear lista
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
