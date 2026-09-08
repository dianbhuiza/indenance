import { type ReactNode } from 'react';
import clsx from 'clsx';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-0.5 text-danger-600">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {!error && hint && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
}
