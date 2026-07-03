import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);
    if (toast.duration !== Infinity) {
      setTimeout(() => removeToast(id), toast.duration || 3000);
    }
    return id;
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  const { addToast } = context;
  return {
    toast: (opts) => addToast(opts),
    success: (msg, opts = {}) => addToast({ type: 'success', message: msg, ...opts }),
    error: (msg, opts = {}) => addToast({ type: 'error', message: msg, ...opts }),
    warning: (msg, opts = {}) => addToast({ type: 'warning', message: msg, ...opts }),
    info: (msg, opts = {}) => addToast({ type: 'info', message: msg, ...opts }),
  };
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((t) => <Toast key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

function Toast({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  const handleRemove = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const vcVariant = {
    success: "vc-toast-teal",
    error: "vc-toast-coral",
    warning: "vc-toast-amber",
    info: "vc-toast-neutral",
  };

  return (
    <div className={`vc-toast ${vcVariant[toast.type] || vcVariant.info} ${exiting ? 'opacity-0 translate-x-4' : ''} transition-all duration-300`}>
      {ICONS[toast.type] || ICONS.info}
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="font-semibold text-sm mb-0.5">{toast.title}</h4>}
        <p className="text-sm opacity-80">{toast.message}</p>
      </div>
      <button onClick={handleRemove} className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}
