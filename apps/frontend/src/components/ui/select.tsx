import { Select as BaseSelect } from '@base-ui/react/select';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseSelect.Trigger>) {
  return (
    <BaseSelect.Trigger
      className={clsx(
        'flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-xs',
        'hover:border-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon className="text-text-muted">
        <ChevronDown className="h-4 w-4" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

function SelectPopup({
  className,
  ...props
}: React.ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Popup
      className={clsx(
        'z-50 min-w-[180px] rounded-xl border border-border bg-surface p-1.5 shadow-lg',
        'data-[state=open]:animate-slide-in',
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={clsx(
        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none',
        'hover:bg-surface-raised focus:bg-surface-raised data-[highlighted]:bg-surface-raised',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="ml-auto text-primary-600">
        ✓
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('my-1 h-px bg-border', className)} {...props} />
  );
}

export function Select({ className, ...props }: React.ComponentProps<typeof BaseSelect.Root>) {
  return <BaseSelect.Root className={className} {...props} />;
}

Select.Trigger = SelectTrigger;
Select.Portal = BaseSelect.Portal;
Select.Positioner = BaseSelect.Positioner;
Select.Value = BaseSelect.Value;
Select.Popup = SelectPopup;
Select.Item = SelectItem;
Select.Separator = SelectSeparator;
