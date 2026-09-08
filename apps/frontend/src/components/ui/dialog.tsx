import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import clsx from 'clsx';

function DialogRoot({
  children,
  ...props
}: React.ComponentProps<typeof BaseDialog.Root>) {
  return <BaseDialog.Root {...props}>{children}</BaseDialog.Root>;
}

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      className={clsx(
        'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in',
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Popup
      className={clsx(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'rounded-xl border border-border bg-surface p-6 shadow-lg',
        'data-[state=open]:animate-scale-in',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      className={clsx('text-lg font-semibold text-text', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      className={clsx('mt-1 text-sm text-text-secondary', className)}
      {...props}
    />
  );
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger: BaseDialog.Trigger,
  Close: BaseDialog.Close,
  Portal: BaseDialog.Portal,
  Backdrop: DialogBackdrop,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
});
