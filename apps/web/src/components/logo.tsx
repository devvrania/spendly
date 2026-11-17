import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight text-stone-900', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 16c2.5 0 3.5-8 6-8s3 6 5 6 2.5-4 5-4" />
        </svg>
      </span>
      Spendly
    </span>
  );
}
