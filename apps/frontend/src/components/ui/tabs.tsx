import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import clsx from 'clsx';

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={clsx(
        'inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised p-1',
        className,
      )}
      {...props}
    />
  );
}

function TabsTab({
  className,
  ...props
}: React.ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={clsx(
        'rounded-md px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors',
        'hover:text-text data-[selected]:bg-surface data-[selected]:text-text data-[selected]:shadow-xs',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({
  className,
  ...props
}: React.ComponentProps<typeof BaseTabs.Panel>) {
  return (
    <BaseTabs.Panel
      className={clsx('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}

export const Tabs = Object.assign(BaseTabs.Root, {
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
});
