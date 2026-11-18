export const INTERVAL_VALUES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

export type IntervalValue = (typeof INTERVAL_VALUES)[number];

export const INTERVALS: { value: IntervalValue; label: string }[] = [
  { value: 'DAILY', label: 'Diaria' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'YEARLY', label: 'Anual' },
];
