import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';

function CheckboxRoot({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseCheckbox.Root>) {
  return (
    <BaseCheckbox.Root
      className={clsx(
        'flex items-center gap-2 text-sm text-text',
        className,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator
        className={clsx(
          'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
          'border-border bg-surface group-data-[checked]:border-primary-600 group-data-[checked]:bg-primary-600',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
          'group-disabled:cursor-not-allowed group-disabled:opacity-50',
        )}
      >
        <svg
          className="h-3.5 w-3.5 text-white opacity-0 group-data-[checked]:opacity-100"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M3 8l2.5 2.5L11 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </BaseCheckbox.Indicator>
      {children}
    </BaseCheckbox.Root>
  );
}

export const Checkbox = CheckboxRoot;
