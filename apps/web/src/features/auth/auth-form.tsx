'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api, ApiError, errorMessage } from '@/lib/api';
import { keys } from '@/lib/queries';
import type { User } from '@/lib/types';
import { DemoButton } from './demo-button';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, 'Name is required').max(100),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});

type Mode = 'login' | 'register';
type Values = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const isRegister = mode === 'register';

  const form = useForm<Values>({
    resolver: zodResolver(isRegister ? registerSchema : (loginSchema as unknown as typeof registerSchema)),
    defaultValues: { name: '', email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const body = isRegister ? values : { email: values.email, password: values.password };
      const user = await api<User>(`/auth/${mode}`, { method: 'POST', body, skipAuthRedirect: true });
      qc.clear();
      qc.setQueryData(keys.me, user);
      const next = params.get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
    } catch (e) {
      if (e instanceof ApiError && e.errors.length) {
        for (const fe of e.errors) form.setError(fe.field as keyof Values, { message: fe.messages[0] });
      } else {
        setFormError(errorMessage(e));
      }
    }
  });

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {isRegister ? 'Start tracking where your money goes.' : 'Log in to see your finances.'}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {formError && (
          <div role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {formError}
          </div>
        )}
        {isRegister && (
          <Field label="Name" error={errors.name?.message}>
            <Input autoComplete="name" autoFocus {...form.register('name')} />
          </Field>
        )}
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" autoFocus={!isRegister} {...form.register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint={isRegister ? 'At least 8 characters.' : undefined}>
          <Input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} {...form.register('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {isRegister ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-stone-400" aria-hidden>
        <span className="h-px flex-1 bg-stone-200" /> or <span className="h-px flex-1 bg-stone-200" />
      </div>
      <DemoButton className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 shadow-xs hover:bg-stone-50">
        Explore a demo account
      </DemoButton>

      <p className="mt-6 text-center text-sm text-stone-500">
        {isRegister ? 'Already have an account? ' : 'New to Spendly? '}
        <Link href={isRegister ? '/login' : '/register'} className="font-medium text-brand-700 hover:underline">
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </>
  );
}
