import React, { useState, useEffect } from 'react';

interface PromptModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title = 'task-dashboard dice:',
  message,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-[340px] bg-[#05070e] border border-white/10 rounded-3xl p-6 shadow-2xl">
        <p className="text-xs font-semibold text-gray-400 mb-1">{title}</p>
        <p className="text-sm font-bold text-white mb-4">{message}</p>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0a0d17] border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none mb-6 transition-all"
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 text-xs font-bold">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-[320px] bg-[#05070e] border border-white/10 rounded-3xl p-6 text-center shadow-2xl">
        <h3 className="text-lg font-black text-white mb-1 tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs font-semibold text-gray-400 mb-6">{subtitle}</p>}

        <div className="space-y-2 mt-4">
          <button
            onClick={onConfirm}
            className={`w-full py-2.5 px-4 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/20'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
