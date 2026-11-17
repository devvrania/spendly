import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-stone-200/70', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 rounded-2xl bg-stone-100 p-3 text-stone-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-2xl bg-rose-50 p-3 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-stone-900">Couldn&apos;t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
