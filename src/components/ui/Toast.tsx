import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { create } from 'zustand';

type ToastVariant = 'default' | 'destructive';

interface ToastPayload {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastState {
  active: (ToastPayload & { id: number }) | null;
  showToast: (payload: ToastPayload | string, legacyType?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

interface LegacyToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const useToastStore = create<ToastState>((set) => ({
  active: null,
  showToast: (payload, legacyType) => {
    if (typeof payload === 'string') {
      const variant: ToastVariant = legacyType === 'error' ? 'destructive' : 'default';
      set({
        active: {
          id: Date.now(),
          title: payload,
          variant,
          duration: 3000,
        },
      });
      return;
    }

    set({
      active: {
        id: Date.now(),
        title: payload.title,
        description: payload.description,
        variant: payload.variant ?? 'default',
        duration: payload.duration ?? 3000,
      },
    });
  },
  hideToast: () => set({ active: null }),
}));

interface LegacyToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

// Legacy visual component kept for backward compatibility
export function Toast({ message, type = 'success', onClose, duration = 3000 }: LegacyToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const tone =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-orange-200 bg-white/95 text-stone-800';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`fixed bottom-24 left-1/2 z-50 max-w-[var(--toast-max-width)] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg ${tone}`}
        onClick={onClose}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}

export function useToast() {
  const active = useToastStore((state) => state.active);
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);

  const legacyToast: LegacyToastState | null =
    active === null
      ? null
      : {
          id: active.id,
          message: active.description ? `${active.title} — ${active.description}` : active.title,
          type: active.variant === 'destructive' ? 'error' : 'success',
        };

  return {
    toast: legacyToast,
    activeToast: active,
    showToast,
    hideToast,
  };
}

export function Toaster() {
  const active = useToastStore((state) => state.active);
  const hideToast = useToastStore((state) => state.hideToast);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(hideToast, active.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [active, hideToast]);

  return (
    <div aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {active ? (
          <motion.div
            key={active.id}
            role={active.variant === 'destructive' ? 'alert' : 'status'}
            aria-live={active.variant === 'destructive' ? 'assertive' : 'polite'}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className={`fixed bottom-[var(--toast-safe-offset)] left-1/2 z-dropdown w-[var(--toast-mobile-width)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              active.variant === 'destructive'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-orange-200 bg-white/95 text-stone-800'
            }`}
            onClick={hideToast}
          >
            <p className="font-semibold">{active.title}</p>
            {active.description ? <p className="mt-1 text-xs text-stone-500">{active.description}</p> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
