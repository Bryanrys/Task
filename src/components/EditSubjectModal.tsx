import React, { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, Check, AlertTriangle } from 'lucide-react';
import { SubjectItem } from '../types';

interface EditSubjectModalProps {
  isOpen: boolean;
  subject: SubjectItem | null;
  onClose: () => void;
  onRename: (subjectId: string, newName: string) => void;
  onDelete: (subjectId: string) => void;
  canDelete: boolean;
  isDark?: boolean;
}

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  isOpen,
  subject,
  onClose,
  onRename,
  onDelete,
  canDelete,
  isDark = true,
}) => {
  const [name, setName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setConfirmingDelete(false);
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onRename(subject.id, name.trim().toUpperCase());
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirmingDelete) {
      onDelete(subject.id);
      onClose();
    } else {
      setConfirmingDelete(true);
    }
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider font-mono">
                EDITAR MATERIA
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Modifica el nombre o elimina la materia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rename Form */}
        <form onSubmit={handleSave} className="space-y-4 mb-4">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              NOMBRE DE LA MATERIA:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. PROGRA 3, REDES, etc."
              className={`w-full py-2.5 px-3.5 rounded-xl border text-sm font-extrabold uppercase outline-none font-mono transition-all ${
                isDark
                  ? 'bg-black/30 border-white/10 text-white focus:border-white'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-900'
              }`}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                isDark
                  ? 'bg-white text-zinc-950 border-white hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar</span>
            </button>
          </div>
        </form>

        {/* Delete Subject Section */}
        {canDelete && (
          <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
            {confirmingDelete ? (
              <div className="space-y-2">
                <p className="text-[11px] text-rose-500 flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ¿Seguro que deseas eliminar esta materia y sus tareas?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                      isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'
                    }`}
                  >
                    No, cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="w-full py-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar esta materia del dashboard</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
