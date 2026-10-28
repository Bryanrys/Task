import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Check } from 'lucide-react';
import { triggerHaptic } from '../services/hapticsService';

interface StartDateModalProps {
  isOpen: boolean;
  currentDateISO?: string;
  onSave: (newDateISO: string, formattedDateStr: string) => void;
  onClose: () => void;
}

export const StartDateModal: React.FC<StartDateModalProps> = ({
  isOpen,
  currentDateISO = '2026-07-06',
  onSave,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDateISO || '2026-07-06');

  if (!isOpen) return null;

  // Calculate preview of elapsed days
  const calculatePreviewDays = (dateStr: string) => {
    try {
      const start = new Date(dateStr + 'T00:00:00');
      const now = new Date();
      const d1 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    } catch {
      return 0;
    }
  };

  const previewDays = calculatePreviewDays(selectedDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      const d = new Date(selectedDate + 'T00:00:00');
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
      const year = d.getFullYear();
      const formatted = `${day} ${month} ${year}`;
      onSave(selectedDate, formatted);
    } catch {
      onSave(selectedDate, selectedDate);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) {
            triggerHaptic('light');
            onClose();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] bg-[#131417] border border-white/10 rounded-3xl p-6 shadow-2xl text-white"
      >
        {/* Barra superior de arrastre */}
        <div className="w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-white/20 mx-auto -mt-2 mb-3 cursor-grab active:cursor-grabbing select-none" />

        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm tracking-wide uppercase font-mono">
              FECHA DE INICIO DEL CICLO
            </h3>
            <p className="text-[11px] text-zinc-400">
              Para calcular los días transcurridos
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
              SELECCIONA EL DÍA QUE INICIASTE:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-black/30 border border-white/10 focus:border-white rounded-xl px-3.5 py-3 text-sm text-white font-semibold outline-none cursor-pointer font-mono"
              required
            />
          </div>

          {/* Live calculation preview card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Días transcurridos:</span>
            </div>
            <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              {previewDays} días
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-white !text-black text-black font-bold text-xs rounded-xl transition-all border border-white hover:bg-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar Fecha</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
