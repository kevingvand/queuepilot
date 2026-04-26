import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastCtx = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      const duration = opts.duration ?? 5000;
      setToasts((prev) => [...prev, { ...opts, id }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Individual toast
// ---------------------------------------------------------------------------

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const bgColor =
    t.variant === 'destructive'
      ? 'var(--danger)'
      : t.variant === 'success'
        ? 'var(--success)'
        : 'var(--bg-secondary)';

  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm min-w-[240px] max-w-sm"
      style={{
        backgroundColor: bgColor,
        border: '1px solid var(--border)',
        color: t.variant ? '#ffffff' : 'var(--text-primary)',
      }}
    >
      <span className="flex-1">{t.message}</span>
      {t.action && (
        <button
          onClick={() => {
            t.action!.onClick();
            onDismiss(t.id);
          }}
          className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2"
          style={{ color: t.variant ? '#ffffff' : 'var(--accent)' }}
        >
          {t.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 text-base leading-none"
      >
        ×
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
