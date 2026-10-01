import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';

interface BloqueTareaItem {
  id: string;
  texto: string;
  completada: boolean;
}

interface BloqueTareasWidgetProps {
  tareas: BloqueTareaItem[];
  isDark?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (texto: string) => void;
}

export const BloqueTareasWidget: React.FC<BloqueTareasWidgetProps> = ({
  tareas = [],
  isDark = true,
  onToggle,
  onDelete,
  onAdd,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const pendientesCount = tareas.filter((t) => !t.completada).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAdd(inputText.trim());
    setInputText('');
    setIsModalOpen(false);
  };

  return (
    <div
      className={`rounded-3xl p-4 transition-all mb-4 liquid-gloss ${
        isDark ? 'liquid-card-dark' : 'liquid-card-light'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b pb-2.5 mb-3 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}
      >
        <span
          className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-mono ${
            isDark ? 'text-yellow-400' : 'text-amber-600'
          }`}
        >
          <span>📌 ACTIVIDADES A CUMPLIR</span>
          <span className={isDark ? 'text-stone-400 font-bold' : 'text-stone-500 font-bold'}>
            ({pendientesCount})
          </span>
        </span>

        <button
          onClick={() => setIsModalOpen(true)}
          className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer font-mono active:scale-95 ${
            isDark
              ? 'bg-amber-500/15 hover:bg-yellow-400 hover:text-black text-yellow-300 border border-yellow-400/30'
              : 'bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 border border-amber-200 shadow-2xs'
          }`}
        >
          + Nueva
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
        {tareas.length === 0 ? (
          <p
            className={`text-xs text-center py-2 italic font-mono ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}
          >
            No hay tareas pendientes en este bloque.
          </p>
        ) : (
          tareas.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded-xl border backdrop-blur-md transition-all ${
                isDark
                  ? 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                  : 'border-black/[0.06] bg-white/70 hover:bg-white/90 shadow-2xs'
              } ${item.completada ? 'opacity-40' : ''}`}
            >
              <div
                onClick={() => onToggle(item.id)}
                className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    item.completada
                      ? isDark
                        ? 'bg-yellow-400 border-yellow-400 text-black'
                        : 'bg-amber-500 border-amber-500 text-white'
                      : isDark
                      ? 'border-stone-500 bg-white/5'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {item.completada && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <span
                  className={`text-xs font-semibold truncate ${
                    item.completada
                      ? isDark
                        ? 'line-through text-yellow-400 font-mono'
                        : 'line-through text-amber-600 font-mono'
                      : isDark
                      ? 'text-stone-200'
                      : 'text-stone-800'
                  }`}
                  title={item.texto}
                >
                  {item.texto}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className={`p-1 cursor-pointer transition-colors text-xs ${
                  isDark
                    ? 'text-stone-500 hover:text-rose-400'
                    : 'text-stone-400 hover:text-rose-600'
                }`}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal Nueva Tarea Bloque */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            className={`relative w-full max-w-[340px] rounded-3xl p-6 shadow-2xl liquid-gloss ${
              isDark ? 'liquid-modal-dark text-white' : 'liquid-modal-light text-stone-900'
            }`}
          >
            <h3 className="font-extrabold text-sm text-yellow-400 uppercase tracking-wide mb-1 font-mono">
              📌 Nueva Tarea Pendiente
            </h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              Escribe tu actividad a cumplir:
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ej. Entregar reporte de física..."
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all ${
                  isDark
                    ? 'bg-white/[0.06] border border-white/15 focus:border-yellow-400 text-white placeholder-stone-500'
                    : 'bg-white border border-stone-200 focus:border-amber-500 text-stone-900 placeholder-stone-400 shadow-2xs'
                }`}
                autoFocus
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-yellow-500/10 cursor-pointer"
                >
                  Agregar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
