'use client';

import { cn } from '@/lib/cn';

interface Option<T extends string> {
  value: T;
  label: string;
  activeClass?: string;
}

/** A radio group styled as a segmented control (arrow keys work natively). */
export function Segmented<T extends string>({
  name,
  value,
  onChange,
  options,
  label,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-xl bg-stone-100 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              'flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-all',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-500',
              active ? cn('bg-white shadow-sm', o.activeClass ?? 'text-stone-900') : 'text-stone-500 hover:text-stone-800',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
