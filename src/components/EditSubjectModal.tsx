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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#141210] border-[#292524] text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider font-mono">
                EDITAR MATERIA
              </h3>
              <p className="text-[11px] text-stone-400">Modifica el nombre o elimina la materia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rename Form */}
        <form onSubmit={handleSave} className="space-y-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 font-mono">
              NOMBRE DE LA MATERIA:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. PROGRA 3, REDES, etc."
              className={`w-full py-2.5 px-3.5 rounded-xl border text-sm font-extrabold uppercase outline-none font-mono transition-all ${
                isDark
                  ? 'bg-[#1a1715] border-[#38332e] text-yellow-400 focus:border-yellow-400'
                  : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-amber-500'
              }`}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1a1715] text-stone-400 hover:text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-yellow-500/10 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        </form>

        {/* Delete Subject Section */}
        {canDelete && (
          <div className="pt-3 border-t border-stone-800/60">
            {confirmingDelete ? (
              <div className="space-y-2">
                <p className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ¿Seguro que deseas eliminar esta materia y sus tareas?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 py-2 text-xs text-stone-400 hover:text-white"
                  >
                    No, cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="w-full py-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
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
