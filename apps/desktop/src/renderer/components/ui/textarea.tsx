import * as React from 'react';
import { cn } from '../../lib/utils';

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary',
        'resize-none',
        className,
      )}
      {...props}
    />
  );
}
