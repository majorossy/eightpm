'use client';

import { useState, useCallback, createContext, useContext } from 'react';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface ToastStyle {
  bg?: string;
  border?: string;
  text?: string;
  icon?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  customStyle?: ToastStyle;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  showError: (message: string) => void;
  showSuccess: (message: string, customStyle?: ToastStyle) => void;
  showInfo: (message: string, customStyle?: ToastStyle) => void;
  showWarning: (message: string) => void;
}

// Generate unique ID for each toast
let toastIdCounter = 0;
const generateToastId = () => `toast-${++toastIdCounter}-${Date.now()}`;

// Default auto-dismiss duration (5 seconds)
const DEFAULT_DURATION = 5000;

export const ToastContext = createContext<ToastContextType | null>(null);

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = DEFAULT_DURATION,
    customStyle?: ToastStyle
  ) => {
    const id = generateToastId();
    const newToast: Toast = { id, message, type, duration, customStyle };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const showError = useCallback((message: string) => {
    return addToast(message, 'error');
  }, [addToast]);

  const showSuccess = useCallback((message: string, customStyle?: ToastStyle) => {
    return addToast(message, 'success', DEFAULT_DURATION, customStyle);
  }, [addToast]);

  const showInfo = useCallback((message: string, customStyle?: ToastStyle) => {
    return addToast(message, 'info', DEFAULT_DURATION, customStyle);
  }, [addToast]);

  const showWarning = useCallback((message: string) => {
    return addToast(message, 'warning');
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
