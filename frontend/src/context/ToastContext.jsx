import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    // Small delay to trigger animation
    const timer = setTimeout(() => setIsShowing(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(() => onRemove(toast.id), 300); // match transition duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FiCheckCircle className="text-emerald-500 text-[20px]" />;
      case 'error':
        return <FiAlertCircle className="text-red-500 text-[20px]" />;
      default:
        return <FiInfo className="text-blue-500 text-[20px]" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'error':
        return 'border-red-500/30';
      default:
        return 'border-blue-500/30';
    }
  };

  return (
    <div
      className={`pointer-events-auto w-80 bg-surface/95 backdrop-blur-lg border ${getBorderColor()} shadow-lg rounded-xl p-4 flex items-start gap-3 transition-all duration-300 transform ${
        isShowing ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 font-body-md text-on-surface text-sm">{toast.message}</div>
      <button
        onClick={handleClose}
        className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <FiX className="text-[18px]" />
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
