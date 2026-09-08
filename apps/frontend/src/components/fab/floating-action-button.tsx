import { useState, useCallback, useRef } from 'react';
import { Plus, ArrowRightLeft, ShoppingCart, PiggyBank, CalendarClock } from 'lucide-react';
import clsx from 'clsx';

interface FabAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const actions: FabAction[] = [
  { id: 'transaction', label: 'Transacción', icon: ArrowRightLeft, color: 'text-primary-700 dark:text-primary-300', bgColor: 'bg-primary-100 dark:bg-primary-900/40' },
  { id: 'shopping', label: 'Lista de compra', icon: ShoppingCart, color: 'text-accent-700 dark:text-accent-300', bgColor: 'bg-accent-100 dark:bg-accent-900/40' },
  { id: 'budget', label: 'Presupuesto', icon: PiggyBank, color: 'text-violet-700 dark:text-violet-300', bgColor: 'bg-violet-100 dark:bg-violet-900/40' },
  { id: 'planned', label: 'Transacción planeada', icon: CalendarClock, color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900/40' },
];

interface FloatingActionButtonProps {
  onAction: (actionId: string) => void;
}

export function FloatingActionButton({ onAction }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasOpened = useRef(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) hasOpened.current = true;
      return !prev;
    });
  }, []);

  const handleAction = useCallback(
    (actionId: string) => {
      setIsOpen(false);
      onAction(actionId);
    },
    [onAction],
  );

  const showCollapse = !isOpen && hasOpened.current;

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={handleToggle}
      />

      {/* FAB Menu Items */}
      <div className="fixed bottom-28 right-5 z-50 flex flex-col-reverse items-end gap-3 lg:bottom-28 lg:right-8">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className={clsx(
                'flex items-center gap-3 transition-all duration-300',
                isOpen
                  ? 'animate-fab-expand'
                  : showCollapse && 'pointer-events-none animate-fab-collapse',
              )}
              style={{ animationDelay: isOpen ? `${i * 50}ms` : `${(actions.length - 1 - i) * 30}ms` }}
            >
              {/* Label */}
              <span
                className={clsx(
                  'whitespace-nowrap rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-md border border-border',
                  'transition-all duration-200',
                  isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2',
                )}
              >
                {action.label}
              </span>

              {/* Icon button */}
              <button
                onClick={() => handleAction(action.id)}
                className={clsx(
                  'flex h-11 w-11 items-center justify-center rounded-full shadow-md border border-border/50',
                  'transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95',
                  action.bgColor,
                )}
              >
                <Icon className={clsx('h-5 w-5', action.color)} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={handleToggle}
        className={clsx(
          'fixed bottom-6 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/25',
          'transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-105 active:scale-95',
          'lg:bottom-8 lg:right-8',
          isOpen && 'rotate-45 bg-gradient-to-br from-danger-500 to-danger-600 shadow-danger-500/25',
        )}
      >
        <Plus className={clsx('h-6 w-6 transition-transform duration-300', isOpen && 'rotate-90')} />
      </button>
    </>
  );
}
