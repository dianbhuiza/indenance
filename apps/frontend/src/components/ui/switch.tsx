import { Switch as BaseSwitch } from '@base-ui/react/switch';
import clsx from 'clsx';

function SwitchRoot({
  className,
  ...props
}: React.ComponentProps<typeof BaseSwitch.Root>) {
  return (
    <BaseSwitch.Root
      className={clsx(
        'group relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'data-[checked]:bg-primary-600 bg-neutral-300 dark:bg-neutral-600',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function SwitchThumb({
  className,
  ...props
}: React.ComponentProps<typeof BaseSwitch.Thumb>) {
  return (
    <BaseSwitch.Thumb
      className={clsx(
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform',
        'group-data-[checked]:translate-x-5 translate-x-0',
        className,
      )}
      {...props}
    />
  );
}

export const Switch = Object.assign(SwitchRoot, {
  Thumb: SwitchThumb,
});
