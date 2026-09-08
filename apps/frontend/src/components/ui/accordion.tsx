import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof BaseAccordion.Item>) {
  return (
    <BaseAccordion.Item
      className={clsx('border-b border-border', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseAccordion.Trigger>) {
  return (
    <BaseAccordion.Trigger
      className={clsx(
        'flex w-full items-center justify-between py-4 text-sm font-medium text-text',
        'hover:text-primary-600 transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
    </BaseAccordion.Trigger>
  );
}

function AccordionPanel({
  className,
  ...props
}: React.ComponentProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel
      className={clsx(
        'overflow-hidden text-sm text-text-secondary',
        className,
      )}
      {...props}
    />
  );
}

export const Accordion = Object.assign(BaseAccordion.Root, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
});
