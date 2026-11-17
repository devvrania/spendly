import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

/** Label + control + hint/error, wired together with ids for screen readers. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      {isValidElement(children) &&
        cloneElement(children, { id, 'aria-describedby': describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
