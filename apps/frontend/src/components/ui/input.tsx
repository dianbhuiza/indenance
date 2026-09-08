import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text shadow-xs placeholder:text-text-muted',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'transition-colors duration-150',
            error ? 'border-danger-500' : 'border-border',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
