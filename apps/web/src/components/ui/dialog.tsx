'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Built on the native <dialog> element: focus trapping, Escape to close, and
 * an inert background come from the browser, which keeps this accessible.
 */
export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="text-lg font-semibold text-stone-900">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-1">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children && <div className="mt-5">{children}</div>}
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
