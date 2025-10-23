// components/Toast.tsx
'use client';

import React from 'react';
import { useToast } from '@/contexts/ToastContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getToastStyles = (type: string) => {
    const baseStyles = "flex w-full max-w-sm items-center gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-200 bg-green-50 text-green-900`;
      case 'error':
        return `${baseStyles} border-red-200 bg-red-50 text-red-900`;
      case 'warning':
        return `${baseStyles} border-yellow-200 bg-yellow-50 text-yellow-900`;
      default:
        return `${baseStyles} border-blue-200 bg-blue-50 text-blue-900`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
        >
          <div className="flex-shrink-0">
            {getToastIcon(toast.type)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{toast.titre}</h4>
            <p className="text-sm opacity-90 mt-1">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 rounded-full p-1 hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}