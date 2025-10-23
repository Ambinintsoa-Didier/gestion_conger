// contexts/ToastContext.tsx - AVEC PROTECTION ANTI-SPAM
'use client';

import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: string;
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastToastTime, setLastToastTime] = useState<number>(0);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const now = Date.now();
    
    // 👇 EMPÊCHE LE SPAM - au moins 3 secondes entre les toasts
    if (now - lastToastTime < 3000) {
      console.log('🔕 Toast ignoré (anti-spam)');
      return;
    }
    
    setLastToastTime(now);
    
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}