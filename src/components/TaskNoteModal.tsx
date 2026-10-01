import React, { useState, useEffect } from 'react';
import { Edit2, Clock, Calendar, Check, X, Trash2 } from 'lucide-react';

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
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setDeadline(localISO);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#141210] border-[#292524] text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide font-mono uppercase">
                DETALLES DE LA TAREA
              </h3>
              <p className="text-[11px] text-stone-400">Nota y fecha límite de entrega</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-400 mb-3 font-medium">
          Materia / Actividad: <span className="text-yellow-400 font-bold">{taskName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note Input */}
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 font-mono">
              📝 NOTA O INSTRUCCIONES:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Formato IEEE, subir en PDF antes de las 11:59..."
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none resize-none font-mono border transition-all ${
                isDark
                  ? 'bg-[#1a1715] border-[#38332e] text-white focus:border-yellow-400'
                  : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Deadline Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-500" />
                <span>FECHA Y HORA LÍMITE (DEADLINE):</span>
              </label>
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
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
                  ? 'bg-[#1a1715] border-[#38332e] text-yellow-400 focus:border-yellow-400'
                  : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-amber-500'
              }`}
            />

            {/* Quick Presets */}
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleSetQuickDeadline(0)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer font-mono ${
                  isDark
                    ? 'border-stone-800 bg-[#1c1917] text-stone-300 hover:text-white'
                    : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Hoy 11:59 PM
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDeadline(1)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer font-mono ${
                  isDark
                    ? 'border-stone-800 bg-[#1c1917] text-stone-300 hover:text-white'
                    : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDeadline(6)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer font-mono ${
                  isDark
                    ? 'border-stone-800 bg-[#1c1917] text-stone-300 hover:text-white'
                    : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Fin de semana
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800/60">
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-yellow-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
