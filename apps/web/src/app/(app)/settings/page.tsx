'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { useLogout } from '@/features/auth/use-logout';
import { errorMessage } from '@/lib/api';
import { useMe, useUpdateProfile } from '@/lib/queries';

export default function SettingsPage() {
  const { data: me } = useMe();
  const update = useUpdateProfile();
  const { logout, pending } = useLogout();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => setName(me?.name ?? ''), [me?.name]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const trimmed = name.trim();
    if (!trimmed) return setError('Name is required');
    try {
      await update.mutateAsync(trimmed);
      toast.success('Profile updated');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and session." />
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader title="Profile" />
          <form onSubmit={save} noValidate className="space-y-4 p-5">
            <Field label="Display name" error={error}>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
            </Field>
            <Field label="Email" hint="Email changes aren't supported yet.">
              <Input value={me?.email ?? ''} readOnly disabled />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={update.isPending} disabled={name.trim() === me?.name}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Session" description="Log out of Spendly on this device." />
          <div className="p-5">
            <Button variant="secondary" onClick={logout} loading={pending}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
