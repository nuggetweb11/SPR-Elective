import React from 'react';

export interface ToastProps {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  show,
  type,
  title,
  message,
  onClose
}) => {
  if (!show) return null;

  const typeConfig = {
    success: {
      bg: 'bg-slate-900 border-emerald-500/50',
      badge: 'bg-emerald-500 text-slate-950',
      icon: 'check_circle',
      titleColor: 'text-emerald-400'
    },
    error: {
      bg: 'bg-slate-900 border-rose-500/50',
      badge: 'bg-rose-500 text-white',
      icon: 'error',
      titleColor: 'text-rose-400'
    },
    warning: {
      bg: 'bg-slate-900 border-amber-500/50',
      badge: 'bg-amber-400 text-slate-950',
      icon: 'warning',
      titleColor: 'text-amber-300'
    },
    info: {
      bg: 'bg-slate-900 border-blue-500/50',
      badge: 'bg-blue-500 text-white',
      icon: 'info',
      titleColor: 'text-blue-400'
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
      <div className={`p-4 rounded-2xl shadow-2xl border text-white flex items-start gap-3 backdrop-blur-md ${config.bg}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${config.badge}`}>
          <span className="material-symbols-outlined text-lg">{config.icon}</span>
        </div>
        <div className="flex-1 overflow-hidden pr-1">
          <h4 className={`text-xs font-bold ${config.titleColor}`}>{title}</h4>
          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>
    </div>
  );
};
