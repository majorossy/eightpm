'use client';

import { ReactNode, useContext } from 'react';
import Link from 'next/link';
import { Toast, ToastContext, useToastState } from '@/hooks/useToast';

// Inline SVG icons (matching app style - no external icon library)
const AlertCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Individual toast component
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  // Icon and colors based on toast type
  const getToastStyles = () => {
    switch (toast.type) {
      case 'error':
        return {
          icon: <AlertCircleIcon />,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          iconColor: 'text-red-400',
        };
      case 'success':
        return {
          icon: <CheckCircleIcon />,
          bgColor: '',
          borderColor: '',
          textColor: '',
          iconColor: '',
          containerStyle: {
            backgroundColor: 'color-mix(in srgb, var(--quinary) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--quinary) 30%, transparent)',
          },
          colorStyle: { color: 'var(--quinary)' },
        };
      case 'warning':
        return {
          icon: <AlertTriangleIcon />,
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          iconColor: 'text-yellow-400',
        };
      case 'info':
      default:
        return {
          icon: <InfoIcon />,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-400',
          iconColor: 'text-blue-400',
        };
    }
  };

  const styles = getToastStyles();
  const custom = toast.customStyle;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm
        ${custom ? '' : `${styles.bgColor} ${styles.borderColor}`}
        shadow-lg shadow-black/20
        animate-toast-slide-in
        min-w-[320px] max-w-[420px]
      `}
      style={custom ? {
        backgroundColor: custom.bg,
        borderColor: custom.border,
      } : styles.containerStyle}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 ${custom ? '' : styles.iconColor}`}
        style={custom ? { color: custom.icon ?? custom.text } : styles.colorStyle}
      >
        {styles.icon}
      </div>

      {/* Message */}
      <p
        className={`flex-1 text-sm ${custom ? '' : styles.textColor}`}
        style={custom ? { color: custom.text } : styles.colorStyle}
      >
        {toast.message}
        {custom?.link && (
          <>
            {' '}
            <Link
              href={custom.link.href}
              className="underline font-medium hover:brightness-125 transition-all"
              style={{ color: custom.icon ?? custom.text }}
            >
              {custom.link.label}
            </Link>
          </>
        )}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        aria-label="Dismiss notification"
      >
        <XIcon />
      </button>
    </div>
  );
}

// Toast container that renders all toasts (uses context)
function ToastListFromContext({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}

// Provider component that wraps the app and provides toast context
export function ToastProvider({ children }: { children: ReactNode }) {
  const toastState = useToastState();

  return (
    <ToastContext.Provider value={toastState}>
      {children}
      <ToastListFromContext toasts={toastState.toasts} removeToast={toastState.removeToast} />
    </ToastContext.Provider>
  );
}

// Direct toast list for use when context is already set up
export function ToastContainerFromContext() {
  // This component accesses the parent context directly
  // Used when ToastProvider is already in the tree
  return null; // Toasts are rendered by ToastProvider
}

export default ToastProvider;
