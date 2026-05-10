import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusable?.[0];
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tone =
    type === 'danger'
      ? 'bg-[rgba(220,38,38,0.08)] text-red-600 border-[rgba(220,38,38,0.2)]'
      : type === 'warning'
      ? 'bg-[rgba(217,119,6,0.08)] text-amber-600 border-[rgba(217,119,6,0.2)]'
      : 'bg-[rgba(37,99,235,0.08)] text-[color:var(--hub-primary)] border-[rgba(37,99,235,0.2)]';

  const confirmClass =
    type === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : type === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700'
      : 'bg-[color:var(--hub-primary)] hover:bg-blue-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_22px_56px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${tone}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 id={titleId} className="text-lg font-semibold text-[color:var(--hub-text)]">{title}</h3>
              <p id={descriptionId} className="mt-1 text-sm text-[color:var(--hub-muted)]">{message}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close dialog" className="rounded-full p-2 text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
          >
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white ${confirmClass}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
