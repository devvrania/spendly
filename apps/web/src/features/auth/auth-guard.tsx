'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { setUnauthorizedHandler } from '@/lib/api';
import { useMe } from '@/lib/queries';

/** Confirms the session with the API before rendering private pages. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const me = useMe();

  useEffect(() => {
    const toLogin = () => {
      qc.clear();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    };
    setUnauthorizedHandler(toLogin);
    if (me.isError) toLogin();
  }, [me.isError, qc, router, pathname]);

  if (!me.data) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Loading your account" />
      </div>
    );
  }
  return <>{children}</>;
}
