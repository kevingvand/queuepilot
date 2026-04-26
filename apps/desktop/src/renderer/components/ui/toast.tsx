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
        className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none"
        style={{ maxWidth: '360px', width: 'max-content' }}
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
  const accentColor =
    t.variant === 'destructive'
      ? 'var(--danger)'
      : t.variant === 'success'
        ? 'var(--success)'
        : 'transparent';

  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderLeft: accentColor !== 'transparent' ? `3px solid ${accentColor}` : '1px solid var(--border)',
        color: 'var(--text-primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)',
        minWidth: '260px',
        maxWidth: '340px',
      }}
    >
      {t.variant === 'destructive' && (
        <span style={{ color: 'var(--danger)', flexShrink: 0 }} aria-hidden>⚠</span>
      )}
      {t.variant === 'success' && (
        <span style={{ color: 'var(--success)', flexShrink: 0 }} aria-hidden>✓</span>
      )}
      <span className="flex-1 text-xs leading-snug" style={{ color: 'var(--text-primary)' }}>{t.message}</span>
      {t.action && (
        <button
          onClick={() => {
            t.action!.onClick();
            onDismiss(t.id);
          }}
          className="shrink-0 text-xs font-semibold transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 rounded px-1.5 py-0.5"
          style={{
            color: '#ffffff',
            backgroundColor: 'var(--accent)',
          }}
        >
          {t.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        className="shrink-0 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 leading-none rounded"
        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
      >
        ✕
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
