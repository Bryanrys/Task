import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../services/hapticsService';

interface PromptModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
  isDark?: boolean;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title = 'task-dashboard dice:',
  message,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel,
  isDark = true,
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) {
            triggerHaptic('light');
            onCancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[360px] rounded-3xl p-6 shadow-2xl border transition-all ${
          isDark ? 'bg-[#131417] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Barra superior de arrastre */}
        <div className="w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-white/20 mx-auto -mt-2 mb-3 cursor-grab active:cursor-grabbing select-none" />

        <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{title}</p>
        <p className="text-sm font-bold mb-4">{message}</p>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onConfirm(value);
            }
          }}
          className={`w-full rounded-2xl px-4 py-2.5 text-sm outline-none mb-6 border transition-all ${
            isDark
              ? 'bg-white/5 border-white/10 text-white placeholder-zinc-500 focus:border-white/30'
              : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
          }`}
          autoFocus
        />

        <div className="flex items-center justify-end gap-2.5 text-xs font-bold">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-full font-semibold transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(value)}
            className={`px-5 py-2 rounded-full font-bold shadow-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white !text-black text-black hover:bg-zinc-200'
                : 'bg-black !text-white text-white hover:bg-zinc-800'
            }`}
          >
            Aceptar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  isDark?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  subtitle,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDanger = false,
  isDark = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) {
            triggerHaptic('light');
            onCancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[340px] rounded-3xl p-6 text-center shadow-2xl border transition-all ${
          isDark ? 'bg-[#131417] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Barra superior de arrastre */}
        <div className="w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-white/20 mx-auto -mt-2 mb-3 cursor-grab active:cursor-grabbing select-none" />

        <h3 className="text-base font-extrabold mb-1 tracking-tight">{title}</h3>
        {subtitle && <p className={`text-xs font-medium mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{subtitle}</p>}

        <div className="space-y-2 mt-4">
          <button
            onClick={onConfirm}
            className={`w-full py-2.5 px-4 font-bold text-xs rounded-full transition-all shadow-xs cursor-pointer active:scale-95 ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : isDark
                ? 'bg-white !text-black text-black hover:bg-zinc-200'
                : 'bg-black !text-white text-white hover:bg-zinc-800'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className={`w-full py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {cancelText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
