import { Popover as BasePopover } from '@base-ui/react/popover';
import clsx from 'clsx';

function PopoverBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof BasePopover.Backdrop>) {
  return (
    <BasePopover.Backdrop
      className={clsx('fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  );
}

function PopoverPopup({
  className,
  ...props
}: React.ComponentProps<typeof BasePopover.Popup>) {
  return (
    <BasePopover.Popup
      className={clsx(
        'z-50 rounded-xl border border-border bg-surface p-4 shadow-lg',
        'data-[state=open]:animate-scale-in',
        className,
      )}
      {...props}
    />
  );
}

function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<typeof BasePopover.Title>) {
  return (
    <BasePopover.Title
      className={clsx('text-sm font-semibold text-text', className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<typeof BasePopover.Description>) {
  return (
    <BasePopover.Description
      className={clsx('mt-1 text-sm text-text-secondary', className)}
      {...props}
    />
  );
}

export const Popover = Object.assign(BasePopover.Root, {
  Trigger: BasePopover.Trigger,
  Portal: BasePopover.Portal,
  Backdrop: PopoverBackdrop,
  Popup: PopoverPopup,
  Title: PopoverTitle,
  Description: PopoverDescription,
});
