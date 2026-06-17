'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  className,
}: NumberInputProps) {
  const [draft, setDraft] = React.useState(String(value));

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      onChange(min);
      setDraft(String(min));
      return;
    }
    const next = clamp(parsed, min, max);
    onChange(next);
    setDraft(String(next));
  };

  const adjust = (delta: number) => {
    const next = clamp(value + delta, min, max);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={disabled || value <= min}
        onClick={() => adjust(-step)}
        aria-label="Verlagen"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        disabled={disabled}
        value={draft}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '');
          setDraft(next);
          if (next !== '') {
            const parsed = parseInt(next, 10);
            if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
          }
        }}
        onBlur={() => commit(draft)}
        className={cn(
          'flex h-9 min-w-0 flex-1 rounded-md border border-input bg-input px-2 py-1 text-center text-base text-card-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
        )}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={disabled || value >= max}
        onClick={() => adjust(step)}
        aria-label="Verhogen"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
