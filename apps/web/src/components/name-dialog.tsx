'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { Field } from './ui/field';
import { Input } from './ui/input';

/** Small dialog for creating/renaming something that only has a name. */
export function NameDialog({
  open,
  onClose,
  onSubmit,
  title,
  label,
  initial = '',
  submitLabel,
  maxLength = 80,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  title: string;
  label: string;
  initial?: string;
  submitLabel: string;
  maxLength?: number;
  children?: React.ReactNode;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial);
      setError(undefined);
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError(`${label} is required`);
    if (trimmed.length > maxLength) return setError(`Keep it under ${maxLength} characters`);
    setSaving(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label={label} error={error}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={maxLength + 10} />
        </Field>
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
