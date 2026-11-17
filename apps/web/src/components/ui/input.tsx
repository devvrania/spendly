import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const base =
  'w-full rounded-xl border bg-white px-3 text-sm text-stone-900 shadow-xs transition-colors placeholder:text-stone-400 ' +
  'focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-stone-50 disabled:text-stone-500';

const border = (invalid?: boolean) => (invalid ? 'border-rose-400' : 'border-stone-200');

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input ref={ref} aria-invalid={invalid || undefined} className={cn(base, 'h-10', border(invalid), className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; wrapperClassName?: string }
>(({ className, wrapperClassName, invalid, children, ...props }, ref) => (
  <div className={cn('relative w-full', wrapperClassName)}>
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(base, 'h-10 appearance-none pr-9', border(invalid), className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
  </div>
));
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(base, 'min-h-20 py-2', border(invalid), className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';
