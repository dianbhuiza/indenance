import { Menu as BaseMenu } from '@base-ui/react/menu';
import clsx from 'clsx';

function MenuBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof BaseMenu.Backdrop>) {
  return (
    <BaseMenu.Backdrop
      className={clsx('fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  );
}

function MenuPopup({
  className,
  ...props
}: React.ComponentProps<typeof BaseMenu.Popup>) {
  return (
    <BaseMenu.Popup
      className={clsx(
        'z-50 min-w-[180px] rounded-xl border border-border bg-surface p-1.5 shadow-lg',
        'data-[state=open]:animate-slide-in',
        className,
      )}
      {...props}
    />
  );
}

function MenuItem({
  className,
  ...props
}: React.ComponentProps<typeof BaseMenu.Item>) {
  return (
    <BaseMenu.Item
      className={clsx(
        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none',
        'hover:bg-surface-raised focus:bg-surface-raised',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function MenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('my-1 h-px bg-border', className)} {...props} />
  );
}

function MenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('px-3 py-1.5 text-xs font-medium text-text-muted', className)}
      {...props}
    />
  );
}

export const Menu = Object.assign(BaseMenu.Root, {
  Trigger: BaseMenu.Trigger,
  Portal: BaseMenu.Portal,
  Backdrop: MenuBackdrop,
  Popup: MenuPopup,
  Item: MenuItem,
  Separator: MenuSeparator,
  Label: MenuLabel,
});
