export const CATEGORY_FALLBACK_COLOR = '#a8a29e';

export const CATEGORY_FALLBACK_ICON = '📌';

export const UNASSIGNED_CATEGORY = 'Sin categoría';

export const CATEGORY_COLORS: Record<string, string> = {
  Alimentación: '#14b8a6',
  Transporte: '#f97316',
  Entretenimiento: '#8b5cf6',
  Salud: '#f43f5e',
  Servicios: '#f59e0b',
  Educación: '#10b981',
  Hogar: '#3b82f6',
  Otros: '#a8a29e',
  Salario: '#10b981',
  Freelance: '#14b8a6',
};

export const CATEGORY_ICONS: Record<string, string> = {
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
  [UNASSIGNED_CATEGORY]: '📌',
};

export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return CATEGORY_FALLBACK_COLOR;
  return CATEGORY_COLORS[category] ?? CATEGORY_FALLBACK_COLOR;
}

export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) return CATEGORY_FALLBACK_ICON;
  return CATEGORY_ICONS[category] ?? CATEGORY_FALLBACK_ICON;
}
