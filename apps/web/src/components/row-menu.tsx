'use client';

import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
}

/** Minimal accessible overflow menu (button + list; Escape / outside click closes). */
export function RowMenu({ items, label }: { items: MenuItem[]; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 z-10 mt-1 w-52 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                role="menuitem"
                disabled={item.disabled}
                title={item.hint}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40',
                  item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-stone-700 hover:bg-stone-100',
                )}
              >
                {item.label}
                {item.disabled && item.hint && <span className="block text-xs text-stone-400">{item.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
