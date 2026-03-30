import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const panelVariants = cva('', {
  variants: {
    variant: {
      default: 'surface-panel',
      elevated: 'surface-panel-elevated',
      subtle: 'surface-panel-subtle',
      glass: 'surface-panel-glass',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {
  asChild?: boolean;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';

    return (
      <Comp
        ref={ref}
        className={cn(panelVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Panel.displayName = 'Panel';

export { Panel, panelVariants };
