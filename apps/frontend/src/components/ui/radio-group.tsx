import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import clsx from 'clsx';

function RadioGroupRoot({
  className,
  ...props
}: React.ComponentProps<typeof BaseRadioGroup>) {
  return (
    <BaseRadioGroup
      className={clsx('space-y-2', className)}
      {...props}
    />
  );
}

function RadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseRadio.Root>) {
  return (
    <BaseRadio.Root
      className={clsx(
        'flex items-center gap-2 text-sm text-text',
        className,
      )}
      {...props}
    >
      <BaseRadio.Indicator
        className={clsx(
          'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
          'border-border bg-surface group-data-[checked]:border-primary-600',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
          'group-disabled:cursor-not-allowed group-disabled:opacity-50',
        )}
      >
        <div className="h-2.5 w-2.5 rounded-full bg-transparent group-data-[checked]:bg-primary-600 transition-colors" />
      </BaseRadio.Indicator>
      {children}
    </BaseRadio.Root>
  );
}

function RadioLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={clsx('text-sm text-text', className)} {...props} />
  );
}

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioItem,
  Label: RadioLabel,
});
