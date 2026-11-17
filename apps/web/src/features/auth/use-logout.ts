'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);
  const logout = async () => {
    setPending(true);
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      qc.clear();
      router.replace('/login');
    }
  };
  return { logout, pending };
}
