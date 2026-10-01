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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounceOnce">
      <div className="bg-[#121217] border-2 border-emerald-500/80 rounded-2xl px-5 py-3 shadow-2xl shadow-emerald-500/20 flex items-center gap-3 text-left">
        <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
              🎉 ¡LISTO!
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200">{message}</p>
        </div>
      </div>
    </div>
  );
};
