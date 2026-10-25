import React, { useState, useEffect } from 'react';
import { Edit2, Clock, Check, X } from 'lucide-react';

interface TaskNoteModalProps {
  isOpen: boolean;
  taskName: string;
  initialNote?: string;
  initialDeadline?: string;
  onSave: (note: string, deadlineISO?: string) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const TaskNoteModal: React.FC<TaskNoteModalProps> = ({
  isOpen,
  taskName,
  initialNote = '',
  initialDeadline = '',
  onSave,
  onClose,
  isDark = true,
}) => {
  const [note, setNote] = useState(initialNote);
  const [deadline, setDeadline] = useState(initialDeadline);

  useEffect(() => {
    setNote(initialNote || '');
    setDeadline(initialDeadline || '');
  }, [initialNote, initialDeadline, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(note.trim(), deadline.trim() || undefined);
  };

  const handleSetQuickDeadline = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setDeadline(localISO);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#131417] border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide font-mono uppercase">
                DETALLES DE LA TAREA
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Nota y fecha límite de entrega</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className={`text-xs mb-3 font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Materia / Actividad: <strong className={isDark ? 'text-white' : 'text-zinc-900'}>{taskName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note Input */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              📝 NOTA O INSTRUCCIONES:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Formato IEEE, subir en PDF antes de las 11:59..."
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none resize-none font-mono border transition-all ${
                isDark
                  ? 'bg-black/30 border-white/10 text-white focus:border-white'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-900'
              }`}
            />
          </div>

          {/* Deadline Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>FECHA Y HORA LÍMITE (DEADLINE):</span>
              </label>
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  Quitar límite
                </button>
              )}
            </div>

            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-xs outline-none font-mono border transition-all ${
                isDark
                  ? 'bg-black/30 border-white/10 text-white focus:border-white'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-900'
              }`}
            />

            {/* Quick Presets */}
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleSetQuickDeadline(0)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer font-mono ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Hoy 11:59 PM
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDeadline(1)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer font-mono ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDeadline(6)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer font-mono ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Fin de semana
              </button>
            </div>
          </div>

          <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
            isDark ? 'border-white/10' : 'border-zinc-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                isDark
                  ? 'bg-white text-zinc-950 border-white hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
