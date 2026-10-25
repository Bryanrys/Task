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
    <>
      {tareas.length === 0 ? (
        <div
          className={`rounded-2xl px-3.5 py-2 transition-all mb-3 liquid-gloss flex items-center justify-between border ${
            isDark
              ? 'bg-white/[0.03] border-white/10 text-zinc-300'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs">📌</span>
            <span
              className={`text-[11px] font-black uppercase tracking-wider font-mono ${
                isDark ? 'text-zinc-200' : 'text-zinc-800'
              }`}
            >
              NOTAS / TAREAS EXTRA (0)
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer font-mono active:scale-95 border ${
              isDark
                ? 'bg-white/[0.08] hover:bg-white/15 text-white border-white/15'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 shadow-2xs'
            }`}
          >
            + Nueva
          </button>
        </div>
      ) : (
        <div
          className={`rounded-3xl p-4 transition-all mb-3 liquid-gloss ${
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
                isDark ? 'text-zinc-200' : 'text-zinc-800'
              }`}
            >
              <span>📌 NOTAS / TAREAS EXTRA</span>
              <span className={isDark ? 'text-zinc-400 font-bold' : 'text-zinc-500 font-bold'}>
                ({pendientesCount})
              </span>
            </span>

            <button
              onClick={() => setIsModalOpen(true)}
              className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer font-mono active:scale-95 border ${
                isDark
                  ? 'bg-white/[0.08] hover:bg-white/15 text-white border-white/15'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 shadow-2xs'
              }`}
            >
              + Nueva
            </button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {tareas.map((item) => (
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
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isDark
                        ? 'border-zinc-500 bg-white/5'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {item.completada && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <span
                    className={`text-xs font-semibold truncate ${
                      item.completada
                        ? 'line-through text-zinc-500 font-mono'
                        : isDark
                        ? 'text-zinc-200'
                        : 'text-zinc-800'
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
                      ? 'text-zinc-500 hover:text-rose-400'
                      : 'text-zinc-400 hover:text-rose-600'
                  }`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nueva Tarea Bloque */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            className={`relative w-full max-w-[340px] rounded-3xl p-6 shadow-2xl liquid-gloss ${
              isDark ? 'liquid-modal-dark text-white' : 'liquid-modal-light text-zinc-900'
            }`}
          >
            <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wide mb-1 font-mono">
              📌 Nueva Tarea Pendiente
            </h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
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
                    ? 'bg-white/[0.06] border border-white/15 focus:border-white/40 text-white placeholder-zinc-500'
                    : 'bg-white border border-zinc-200 focus:border-zinc-800 text-zinc-900 placeholder-zinc-400 shadow-2xs'
                }`}
                autoFocus
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer ${
                    isDark
                      ? 'bg-white hover:bg-zinc-200 text-black'
                      : 'bg-zinc-900 hover:bg-black text-white'
                  }`}
                >
                  Agregar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};