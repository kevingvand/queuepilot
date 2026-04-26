import * as React from 'react';
import { cn } from '../../lib/utils';

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
};

export function Select({ value, onChange, children, placeholder, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground',
        'focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer',
        className,
      )}
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}
