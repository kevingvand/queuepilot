import * as React from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary',
        className,
      )}
      {...props}
    />
  );
}
