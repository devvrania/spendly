'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { keys } from '@/lib/queries';
import type { User } from '@/lib/types';

/**
 * "Try the demo": the API creates a private demo account full of sample data
 * and signs this browser into it, so visitors can explore without registering.
 */
export function DemoButton({ className, children = 'Try the live demo' }: { className?: string; children?: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const start = async () => {
    setPending(true);
    try {
      const user = await api<User>('/auth/demo', { method: 'POST', skipAuthRedirect: true });
      qc.clear();
      qc.setQueryData(keys.me, user);
      router.push('/dashboard');
    } catch (e) {
      toast.error(errorMessage(e));
      setPending(false);
    }
  };

  return (
    <button type="button" onClick={start} disabled={pending} aria-busy={pending || undefined} className={cn('disabled:cursor-wait disabled:opacity-70', className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? 'Setting up your demo…' : children}
    </button>
  );
}
