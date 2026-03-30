import { useEffect } from 'react';

import { useUi } from '../../hooks/useUi';
import type { Toast as ToastType } from '../../context/UiContext';

const AUTO_DISMISS_MS = 2000;

const toastStyles: Record<ToastType['type'], string> = {
  success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100',
  error: 'border-red-500/50 bg-red-500/10 text-red-100',
  info: 'border-neutral-600 bg-neutral-800/90 text-neutral-100',
};

const Toast = ({
  toast,
  onDismiss,
}: {
  toast: ToastType;
  onDismiss: (id: string) => void;
}) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={`flex min-w-[280px] max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${toastStyles[toast.type]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-sm opacity-90">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50"
      >
        <span className="text-lg leading-none" aria-hidden>×</span>
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, dismissToast } = useUi();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
