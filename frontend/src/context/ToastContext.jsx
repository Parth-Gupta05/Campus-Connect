import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle, Loader2 } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Geist Sonner-Style Toast Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-2 pointer-events-none sm:w-[350px]"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const remainingTimeRef = useRef(toast.duration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  const handleDismiss = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 180);
  }, [onRemove, toast.id]);

  const startTimer = useCallback(() => {
    if (toast.duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, remainingTimeRef.current);
  }, [toast.duration, handleDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (remainingTimeRef.current > 0) {
      startTimer();
    } else {
      handleDismiss();
    }
  }, [startTimer, handleDismiss]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        );
      case 'error':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        );
      case 'loading':
        return (
          <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        );
    }
  };

  return (
    <div
      role="status"
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      className={`pointer-events-auto ml-auto w-full sm:w-[350px] bg-background-100/95 backdrop-blur-md border border-gray-400 rounded-xl shadow-xl p-3 flex items-start gap-2.5 text-gray-1000 transition-all duration-200 transform select-none ${
        isDismissing 
          ? 'opacity-0 translate-y-2 scale-95' 
          : 'animate-in slide-in-from-bottom-2 fade-in duration-200'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs sm:text-[13px] font-medium leading-snug text-gray-1000 break-words font-sans">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 p-1 -mr-1 -mt-0.5 rounded-md text-gray-500 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
