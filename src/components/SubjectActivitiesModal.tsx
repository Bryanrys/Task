import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Plus,
  Edit3,
  Edit2,
  Calendar,
  MessageSquare,
  Atom,
  FileText,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { SubjectItem, TaskItem } from '../types';
import { getDeadlineStatus } from '../utils/deadline';

interface SubjectActivitiesModalProps {
  isOpen: boolean;
  subject: SubjectItem | null;
  tasks: TaskItem[];
  weekNumber: number;
  onClose: () => void;
  onToggleTask: (taskId: string) => void;
  onOpenNewTask: (subject: SubjectItem) => void;
  onEditTaskNote: (task: TaskItem) => void;
  onEditSubject?: (subject: SubjectItem) => void;
  isDark?: boolean;
}

export const SubjectActivitiesModal: React.FC<SubjectActivitiesModalProps> = ({
  isOpen,
  subject,
  tasks = [],
  weekNumber,
  onClose,
  onToggleTask,
  onOpenNewTask,
  onEditTaskNote,
  onEditSubject,
  isDark = true,
}) => {
  if (!isOpen || !subject) return null;

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const isAllDone = tasks.length > 0 && pendingCount === 0;

  // Icono según nombre
  const getSubjectIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('progra') || n.includes('web') || n.includes('codigo') || n.includes('code')) {
      return '</>';
    }
    if (n.includes('mate') || n.includes('calculo') || n.includes('estadistica')) {
      return '√x';
    }
    return '⚙';
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0a0d17] border border-white/10 p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header de la Ventana */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center font-mono font-black text-pink-400 text-sm shrink-0">
                {getSubjectIcon(subject.name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-white truncate">
                    {subject.name}
                  </h2>
                  {onEditSubject && (
                    <button
                      onClick={() => onEditSubject(subject)}
                      className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Editar nombre de materia"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <span>Semana {weekNumber}</span>
                  <span>•</span>
                  <span>
                    {tasks.length === 0
                      ? 'Sin actividades'
                      : isAllDone
                      ? '¡Todas entregadas!'
                      : `${pendingCount} actividad${pendingCount > 1 ? 'es' : ''} por entregar`}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  isAllDone
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-pink-500/15 text-pink-300 border-pink-500/25'
                }`}
              >
                {isAllDone ? 'Lista ✓' : 'Pendiente'}
              </span>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barra de progreso de la materia */}
          {tasks.length > 0 && (
            <div className="py-3 shrink-0">
              <div className="flex justify-between items-center text-[11px] mb-1.5 font-medium">
                <span className="text-gray-400">Progreso de entregas</span>
                <span className="font-mono text-pink-300 font-bold">
                  {completedCount} / {tasks.length} ({Math.round((completedCount / tasks.length) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className={`h-full rounded-full ${
                    isAllDone
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Lista de Actividades a Entregar (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1 scrollbar-thin">
            {tasks.map((task) => {
              const deadlineInfo = getDeadlineStatus(task.deadlineISO);
              const isForo = task.name.toLowerCase().includes('foro');
              const isLab = task.name.toLowerCase().includes('lab');

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    task.completed
                      ? 'bg-emerald-950/20 border-emerald-500/20'
                      : 'bg-[#05070e] hover:bg-[#0c1020] border-white/5'
                  }`}
                >
                  <div
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        task.completed
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      {isForo ? (
                        <MessageSquare className="w-4 h-4 text-pink-400" />
                      ) : isLab ? (
                        <Atom className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-purple-400" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-100'
                        }`}
                      >
                        {task.name}
                      </span>
                      <span className="text-[11px] text-gray-400 truncate mt-0.5">
                        {task.note || (isForo ? 'Módulo semanal' : isLab ? 'Práctica técnica' : 'Evaluación')}
                      </span>
                      {deadlineInfo && (
                        <span className="text-[10px] font-mono text-pink-300 mt-1">
                          ⏰ {deadlineInfo.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => onEditTaskNote(task)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-pink-300 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Editar nota o fecha límite"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        task.completed
                          ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : 'border-2 border-white/20 hover:border-pink-500 text-transparent'
                      }`}
                      title={task.completed ? 'Marcar como pendiente' : 'Marcar como entregada'}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="text-center py-8 px-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
                <p className="text-sm text-gray-400 font-medium">
                  No hay actividades registradas para esta materia en la Semana {weekNumber}.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Usa el botón de abajo para agregar tu primera tarea.
                </p>
              </div>
            )}
          </div>

          {/* Footer con Acciones */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => onOpenNewTask(subject)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-[0_0_12px_rgba(236,72,153,0.3)] hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Tarea {subject.name}</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
