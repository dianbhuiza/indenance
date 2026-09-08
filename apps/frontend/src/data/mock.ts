export const mockAccounts = [
  { id: '1', name: 'Cuenta Principal', type: 'checking', balance: 12450.75, currency: 'MXN' },
  { id: '2', name: 'Ahorros', type: 'savings', balance: 34200.00, currency: 'MXN' },
  { id: '3', name: 'Tarjeta de Crédito', type: 'credit', balance: -3250.40, currency: 'MXN' },
];

export const mockTransactions = [
  { id: '1', description: 'Supermercado Orgánico', amount: -1250.00, category: 'Alimentación', date: '2026-09-04', icon: '🛒' },
  { id: '2', description: 'Salario mensual', amount: 28500.00, category: 'Ingresos', date: '2026-09-01', icon: '💰' },
  { id: '3', description: 'Netflix', amount: -199.00, category: 'Entretenimiento', date: '2026-09-03', icon: '🎬' },
  { id: '4', description: 'Gasolina Shell', amount: -850.00, category: 'Transporte', date: '2026-09-02', icon: '⛽' },
  { id: '5', description: 'Farmacia Guadalajara', amount: -430.00, category: 'Salud', date: '2026-09-01', icon: '💊' },
  { id: '6', description: 'Café Brûlé', amount: -185.00, category: 'Alimentación', date: '2026-09-04', icon: '☕' },
  { id: '7', description: 'Uber', amount: -245.00, category: 'Transporte', date: '2026-09-03', icon: '🚗' },
  { id: '8', description: 'Freelance diseño', amount: 4500.00, category: 'Ingresos', date: '2026-09-02', icon: '💻' },
];

export const mockMonthlySpending = [
  { month: 'Jul', amount: 18200 },
  { month: 'Ago', amount: 21400 },
  { month: 'Sep', amount: 15800 },
];

export const mockCategorySpending = [
  { category: 'Alimentación', amount: 4850, color: 'var(--color-primary-500)', percentage: 30.7 },
  { category: 'Transporte', amount: 3200, color: 'var(--color-accent-500)', percentage: 20.3 },
  { category: 'Entretenimiento', amount: 2100, color: 'var(--color-violet-500)', percentage: 13.3 },
  { category: 'Salud', amount: 1800, color: 'var(--color-pink-500)', percentage: 11.4 },
  { category: 'Servicios', amount: 2450, color: 'var(--color-amber-500)', percentage: 15.5 },
  { category: 'Otros', amount: 1400, color: 'var(--color-neutral-400)', percentage: 8.8 },
];

export const mockBudgets = [
  { id: '1', name: 'Alimentación', spent: 4850, limit: 6000, color: 'primary' as const },
  { id: '2', name: 'Transporte', spent: 3200, limit: 3500, color: 'accent' as const },
  { id: '3', name: 'Entretenimiento', spent: 2100, limit: 2000, color: 'violet' as const },
  { id: '4', name: 'Servicios', spent: 2450, limit: 3000, color: 'amber' as const },
];
