import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        inbox: 'bg-blue-500/20 text-blue-300',
        in_progress: 'bg-yellow-500/20 text-yellow-300',
        done: 'bg-green-500/20 text-green-300',
        discarded: 'bg-gray-500/20 text-gray-400',
      },
    },
    defaultVariants: {
      status: 'inbox',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, status, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ status }), className)} {...props} />;
}
