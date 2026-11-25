import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-navy-950 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-navy-100 text-navy-900 hover:bg-navy-100/80',
        secondary: 'border-transparent bg-navy-100 text-navy-900 hover:bg-navy-100/80',
        destructive: 'border-transparent bg-error-100 text-error-700 hover:bg-error-100/80',
        outline: 'text-navy-900 border-navy-200',
        success: 'border-transparent bg-success-100 text-success-700 hover:bg-success-100/80',
        warning: 'border-transparent bg-warning-100 text-warning-700 hover:bg-warning-100/80',
        info: 'border-transparent bg-teal-100 text-teal-700 hover:bg-teal-100/80',
        draft: 'border-transparent bg-gray-100 text-gray-700',
        published: 'border-transparent bg-success-100 text-success-700',
        pending: 'border-transparent bg-warning-100 text-warning-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };