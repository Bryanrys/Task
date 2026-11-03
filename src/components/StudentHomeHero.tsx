import React from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Calendar,
  Clock,
  Calculator,
  Timer,
  Sparkles,
  CloudCheck,
  Compass,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { triggerHaptic } from '../services/hapticsService';
import { SubjectItem, WeekItem } from '../types';

interface StudentHomeHeroProps {
  studentName: string;
  isDark: boolean;
  activeWeekNumber: number;
  totalWeeksCount: number;
  pendingTasksCount: number;
  completedTasksCount: number;
  overallUeesAvg: string;
  nextParcialWeek: number;
  weeksUntilParcial: number;
  onOpenTutorial: () => void;
  onOpenSchedule: () => void;
  onOpenCalculator: () => void;
  onOpenPomodoro: () => void;
  onSyncStudentDashboard: () => void;
  isSyncingCloud?: boolean;
}

export const StudentHomeHero: React.FC<StudentHomeHeroProps> = ({
  studentName,
  isDark,
  activeWeekNumber,
  totalWeeksCount,
  pendingTasksCount,
  completedTasksCount,
  overallUeesAvg,
  nextParcialWeek,
  weeksUntilParcial,
  onOpenTutorial,
  onOpenSchedule,
  onOpenCalculator,
  onOpenPomodoro,
  onSyncStudentDashboard,
  isSyncingCloud = false,
}) => {
  const avgNum = parseFloat(overallUeesAvg) || 0;
  const isPassing = avgNum >= 6.0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-3xl p-4 sm:p-6 mb-6 border shadow-xl relative overflow-hidden transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#12141a] via-[#0d0f14] to-[#090a0d] border-white/10 text-white'
          : 'bg-gradient-to-br from-white via-zinc-50 to-zinc-100/80 border-zinc-200 text-zinc-900 shadow-sm'
      }`}
    >
      {/* Elemento de fondo sutil */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Fila Superior: Saludo y Badges de Estudiante */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-md shrink-0 ${
            isDark ? 'bg-white !text-black text-black' : 'bg-black !text-white text-white'
          }`}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                Mi Espacio Estudiantil UEES
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight font-mono mt-0.5">
              ¡Hola, {studentName}! 👋
            </h2>
          </div>
        </div>

        {/* Botones de Acción Superior del Estudiante: Respaldo Privado y Tutorial */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSyncStudentDashboard();
            }}
            disabled={isSyncingCloud}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-200'
                : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}
            title="Sincronizar mi dashboard en la nube para verlo en la web y celular"
          >
            <CloudCheck className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin text-emerald-400' : 'text-emerald-500'}`} />
            <span>{isSyncingCloud ? 'Sincronizando...' : 'Mi Respaldo en la Nube'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onOpenTutorial();
            }}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark
                ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
            }`}
            title="Ver guía y pasos interactivos del dashboard"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Guía Interactiva</span>
          </button>
        </div>
      </div>

      {/* Resumen Semanal y Aviso de Parciales */}
      <div className={`p-3.5 rounded-2xl border mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono relative z-10 ${
        isDark ? 'bg-black/30 border-white/10' : 'bg-white/90 border-zinc-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Calendar className="w-4 h-4" />
          </span>
          <div>
            <span className="font-bold">Semana {activeWeekNumber} de {totalWeeksCount}</span>
            <span className={`block text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {pendingTasksCount === 0
                ? '🎉 ¡Estás al día con todas tus actividades de la semana!'
                : `Tienes ${pendingTasksCount} ${pendingTasksCount === 1 ? 'actividad pendiente' : 'actividades pendientes'} por entregar`}
            </span>
          </div>
        </div>

        {weeksUntilParcial > 0 ? (
          <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${
            isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
          }`}>
            <span>Próximo Parcial:</span>
            <span className="text-emerald-400">Semana {nextParcialWeek} ({weeksUntilParcial} sem. restantes)</span>
          </div>
        ) : (
          <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${
            isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>¡Semana de Exámenes Parciales en curso!</span>
          </div>
        )}
      </div>

      {/* 3 Accesos Rápidos Principales del Estudiante */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
        {/* Acceso 1: Mi Horario y Aulas */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenSchedule();
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-98 flex items-center justify-between ${
            isDark
              ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/20'
              : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-xs font-mono">Mi Horario</span>
              <span className={`block text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Clases, Teams & Meet
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Acceso 2: Calculadora y Promedio UEES */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenCalculator();
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-98 flex items-center justify-between ${
            isDark
              ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/20'
              : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs font-mono">Mis Notas</span>
                <span className={`text-[10px] font-bold font-mono px-1 rounded ${
                  isPassing ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-white/5'
                }`}>
                  {overallUeesAvg}
                </span>
              </div>
              <span className={`block text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Simulador R1, R2 y R3
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Acceso 3: Pomodoro de Estudio */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenPomodoro();
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-98 flex items-center justify-between ${
            isDark
              ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/20'
              : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}>
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-xs font-mono">Modo Estudio</span>
              <span className={`block text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Pomodoro 25 min
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
