import React from 'react';
import { useWallet } from '../contexts/WalletContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWallet();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        let borderClass = 'border-white/10';
        let icon = 'info';
        let iconColor = 'text-primary';
        let bgIconClass = 'bg-primary/10';

        if (toast.type === 'success') {
          borderClass = 'border-[#4cd7f6]/30';
          icon = 'check_circle';
          iconColor = 'text-[#4cd7f6]';
          bgIconClass = 'bg-[#4cd7f6]/10';
        } else if (toast.type === 'error') {
          borderClass = 'border-[#ffb4ab]/30';
          icon = 'warning';
          iconColor = 'text-[#ffb4ab]';
          bgIconClass = 'bg-[#ffb4ab]/10';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto glass-card flex items-center justify-between gap-4 px-5 py-4 rounded-2xl ${borderClass} transition-all duration-300 transform translate-y-0 opacity-100 shadow-2xl animate-fade-in-up`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${bgIconClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className={`material-symbols-outlined ${iconColor} text-[20px]`}>
                  {icon}
                </span>
              </div>
              <div>
                <p className="font-label-md text-label-md font-bold text-white leading-snug">
                  {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
                </p>
                <p className="font-body-md text-[13px] text-[#ccc3d8] leading-tight mt-0.5">
                  {toast.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#ccc3d8] hover:text-white transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
