import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  info: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
