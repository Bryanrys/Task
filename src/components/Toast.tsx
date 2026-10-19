import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="glass-card-uees px-4 py-3 rounded-xl border border-pink-500/40 text-xs text-white shadow-2xl flex items-center space-x-3 backdrop-blur-xl">
        <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
        <span className="font-medium text-slate-100">{message}</span>
      </div>
    </div>
  );
};
