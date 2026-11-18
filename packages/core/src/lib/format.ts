const LOCALE = 'es-MX';

export function formatNumber(value: number): string {
  return value.toLocaleString(LOCALE);
}

export function formatAmount(value: number, fractionDigits = 2): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatCompactAmount(value: number): string {
  if (value > 0) return `$${(value / 1000).toFixed(1)}k`;
  return '$0';
}

export function formatDayMonth(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
