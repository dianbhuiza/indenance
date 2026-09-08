import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-xl border border-border bg-surface p-6 shadow-sm',
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';
