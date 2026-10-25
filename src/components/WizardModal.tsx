import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from 'lucide-react';
import { Dashboard, SubjectItem, WeekItem } from '../types';
import { computeWeekRangeFromDate } from '../utils/dateRange';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (dashboard: Dashboard) => void;
  onOpenAccessCode: () => void;
}

export const WizardModal: React.FC<WizardModalProps> = ({
  isOpen,
  onClose,
  onFinish,
  onOpenAccessCode,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [name, setName] = useState('');
  const todayISO = new Date().toISOString().split('T')[0];
  const [startDateISO, setStartDateISO] = useState<string>(todayISO);
  const [subjectCount, setSubjectCount] = useState<number>(4);

  // Step 2 state
  const [subjectNames, setSubjectNames] = useState<string[]>(['', '', '', '']);

  // Step 3 state
  const [activitiesInput, setActivitiesInput] = useState('Tarea entregada, Examen Parcial entregado');

  if (!isOpen) return null;

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

  const previewDays = calculatePreviewDays(startDateISO);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.max(1, Math.min(10, Number(subjectCount) || 4));
    const updated = Array.from({ length: count }, (_, i) => subjectNames[i] || '');
    setSubjectNames(updated);
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = name.trim() || 'Dashboard 1';
    const taskList = activitiesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const finalTasks = taskList.length > 0 ? taskList : ['Tarea entregada'];

    const subjects: SubjectItem[] = subjectNames.map((sName, idx) => ({
      id: `subj-${Date.now()}-${idx}`,
      name: sName.trim() || `Materia ${idx + 1}`,
    }));

    // Format start date
    let formattedStartDate = '06 JUL 2026';
    try {
      const d = new Date(startDateISO + 'T00:00:00');
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
      const year = d.getFullYear();
      formattedStartDate = `${day} ${month} ${year}`;
    } catch {
      // fallback
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dashId = `dash-${Date.now()}`;
    const week1Id = `week-1-${Date.now()}`;

    // Al crear un nuevo dashboard, siempre inicia limpio con únicamente Semana 1
    const week1SubjectTasks: Record<string, { id: string; name: string; completed: boolean }[]> = {};
    subjects.forEach((subj) => {
      week1SubjectTasks[subj.id] = finalTasks.map((tName, tIdx) => ({
        id: `task-1-${subj.id}-${tIdx}`,
        name: tName,
        completed: false,
      }));
    });

    const weeks: WeekItem[] = [
      {
        id: week1Id,
        weekNumber: 1,
        dateRange: computeWeekRangeFromDate(1, startDateISO),
        status: 'EN PROCESO',
        subjectTasks: week1SubjectTasks,
        bloqueTareas: [],
      },
    ];

    const newDash: Dashboard = {
      id: dashId,
      name: finalName,
      startDate: formattedStartDate,
      startDateISO: startDateISO,
      lastUpdated: `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}, ${formattedTime}`,
      subjects,
      defaultTaskNames: finalTasks,
      weeks,
      activeWeekId: week1Id,
      accessCode: 'oo',
    };

    onFinish(newDash);
    setStep(1);
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-[370px] bg-[#05070e] border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {/* Step 1 */}
          {step === 1 && (
            <motion.form
              key="step-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleStep1Next}
            >
              <h3 className="text-center font-bold text-white text-base tracking-wide mb-5">
                Nuevo Dashboard (1/3)
              </h3>

              <div className="mb-3.5">
                <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                  NOMBRE O ENTORNO
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Escuela, Universidad, Trabajo..."
                  className="w-full bg-[#0a0d17] border border-white/10 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                  autoFocus
                />
              </div>

              {/* Fecha de Inicio */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>DÍA QUE INICIASTE</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">
                    {previewDays} días transcurridos
                  </span>
                </div>
                <input
                  type="date"
                  value={startDateISO}
                  onChange={(e) => setStartDateISO(e.target.value)}
                  className="w-full bg-[#0a0d17] border border-white/10 focus:border-white rounded-xl px-3.5 py-2 text-sm text-white outline-none cursor-pointer font-mono"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  ¿CUÁNTAS MATERIAS O ÁREAS LLEVAS?
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={subjectCount || ''}
                  onChange={(e) => setSubjectCount(Number(e.target.value))}
                  placeholder="Ej. 4"
                  className="w-full bg-[#0a0d17] border border-white/10 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-5 bg-white !text-black text-black font-black text-sm rounded-xl transition-all shadow-md hover:bg-zinc-200 mb-3 flex items-center justify-center gap-1.5 cursor-pointer border border-white font-mono"
              >
                Siguiente Paso 👏
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccessCode();
                }}
                className="w-full text-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1 flex items-center justify-center gap-1 cursor-pointer font-mono"
              >
                🔗 ¡Ya tengo dashboard, entrar directo!
              </button>
            </motion.form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.form
              key="step-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleStep2Next}
            >
              <h3 className="text-center font-bold text-white text-base tracking-wide mb-5 font-mono">
                Materias (2/3)
              </h3>

              <label className="block text-[11px] font-bold text-zinc-400 mb-2.5 uppercase tracking-wider font-mono">
                NOMBRES DE LAS MATERIAS / ÁREAS:
              </label>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 mb-6">
                {subjectNames.map((sName, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={sName}
                    onChange={(e) => {
                      const copy = [...subjectNames];
                      copy[idx] = e.target.value;
                      setSubjectNames(copy);
                    }}
                    placeholder={`Nombre de materia o área ${idx + 1}`}
                    className="w-full bg-[#0a0d17] border border-white/10 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-sm rounded-xl transition-all cursor-pointer font-mono"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 px-5 bg-white !text-black text-black font-black text-sm rounded-xl transition-all shadow-md hover:bg-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer border border-white font-mono"
                >
                  Siguiente Paso 👏
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <motion.form
              key="step-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleComplete}
            >
              <h3 className="text-center font-bold text-white text-base tracking-wide mb-5 font-mono">
                Actividades a Evaluar (3/3)
              </h3>

              <div className="mb-3">
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  ACTIVIDADES POR MATERIA (SEPARADAS POR COMA):
                </label>
                <textarea
                  rows={3}
                  value={activitiesInput}
                  onChange={(e) => setActivitiesInput(e.target.value)}
                  placeholder="Ej. Tarea entregada, Foro entregado, Proyec..."
                  className="w-full bg-[#0a0d17] border border-white/10 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none resize-none transition-all font-mono"
                />
              </div>

              <p className="text-[11px] text-zinc-400 mb-5 text-center leading-relaxed font-mono">
                Cada materia tendrá estas casillas para marcar semanalmente.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 px-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-sm rounded-xl transition-all cursor-pointer font-mono"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 px-5 bg-white !text-black text-black font-black text-base rounded-xl transition-all shadow-md hover:bg-zinc-200 flex items-center justify-center gap-2 cursor-pointer border border-white font-mono"
                >
                  <span>Crear Dashboard</span>
                  <span>✅</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
