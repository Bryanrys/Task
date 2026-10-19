import React from 'react';
import {
  GraduationCap,
  PieChart,
  Calendar,
  CloudUpload,
  CalendarDays,
  Timer,
  Calculator,
  Code2,
  Atom,
  Binary,
  BookOpen,
  Sparkles,
  LogOut,
  X,
} from 'lucide-react';
import { SubjectItem } from '../types';

interface SidebarNavProps {
  currentView: 'dashboard' | 'schedule' | 'cloud';
  onSwitchView: (view: 'dashboard' | 'schedule' | 'cloud') => void;
  subjects: SubjectItem[];
  totalWeeksCount: number;
  loggedUser?: string;
  onScrollToSubject: (subjectId: string) => void;
  onOpenWeeks: () => void;
  onOpenPomodoro: () => void;
  onOpenCalculator: () => void;
  onTriggerCelebration: () => void;
  onLogout: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentView,
  onSwitchView,
  subjects,
  totalWeeksCount,
  loggedUser = 'Estudiante UEES',
  onScrollToSubject,
  onOpenWeeks,
  onOpenPomodoro,
  onOpenCalculator,
  onTriggerCelebration,
  onLogout,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const getSubjectIcon = (name: string, index: number) => {
    const n = name.toLowerCase();
    if (n.includes('progra') || n.includes('web') || n.includes('codigo') || n.includes('code')) {
      return <Code2 className="w-4 h-4 text-pink-400" />;
    }
    if (n.includes('mate') || n.includes('calculo') || n.includes('algebra')) {
      return <Binary className="w-4 h-4 text-purple-400" />;
    }
    if (n.includes('fisi') || n.includes('quim') || n.includes('ciencia')) {
      return <Atom className="w-4 h-4 text-cyan-400" />;
    }
    const colors = ['text-pink-400', 'text-purple-400', 'text-cyan-400', 'text-emerald-400', 'text-amber-400'];
    return <BookOpen className={`w-4 h-4 ${colors[index % colors.length]}`} />;
  };

  const getSubjectDotColor = (index: number) => {
    const dots = ['bg-pink-400', 'bg-purple-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-amber-400', 'bg-fuchsia-400'];
    return dots[index % dots.length];
  };

  return (
    <aside
      className={`bg-[#0e1422] border-r border-white/5 flex flex-col justify-between shrink-0 select-none ${
        isMobileDrawer
          ? 'w-72 h-full shadow-2xl p-0'
          : 'hidden md:flex md:w-64 min-h-screen'
      }`}
    >
      <div className="p-5 space-y-6 overflow-y-auto">
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/25 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-black text-white tracking-widest uppercase">
                REYES ALVARADO
              </h2>
              <p className="text-[10px] text-gray-400 font-mono">UEES Dashboard</p>
            </div>
          </div>

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5 pt-1">
          <button
            onClick={() => {
              onSwitchView('dashboard');
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'text-white bg-gradient-to-r from-pink-500/25 to-purple-500/25 border-l-4 border-pink-500 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PieChart className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Dashboard Principal</span>
          </button>

          <button
            onClick={() => {
              onSwitchView('schedule');
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'schedule'
                ? 'text-white bg-gradient-to-r from-purple-500/25 to-cyan-500/25 border-l-4 border-purple-500 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Horario & Clases</span>
          </button>

          <button
            onClick={() => {
              onSwitchView('cloud');
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'cloud'
                ? 'text-white bg-gradient-to-r from-cyan-500/25 to-pink-500/25 border-l-4 border-cyan-400 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CloudUpload className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Base de Datos Nube</span>
          </button>
        </nav>

        {/* Materias del Ciclo */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 font-mono">
            Materias Ciclo
          </p>
          <div className="space-y-1">
            {subjects.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  onSwitchView('dashboard');
                  onScrollToSubject(s.id);
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 transition-all cursor-pointer group"
              >
                <span className="flex items-center space-x-2.5 truncate pr-2">
                  {getSubjectIcon(s.name, idx)}
                  <span className="truncate group-hover:text-white font-medium">{s.name}</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${getSubjectDotColor(idx)} shrink-0 shadow-xs`} />
              </button>
            ))}
          </div>
        </div>

        {/* Utilidades */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 font-mono">
            Utilidades
          </p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenWeeks();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>Semanas ({totalWeeksCount} Sem.)</span>
            </button>

            <button
              onClick={() => {
                onOpenPomodoro();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
            >
              <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pomodoro Timer</span>
            </button>

            <button
              onClick={() => {
                onOpenCalculator();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Calculadora Promedios</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-white/5 space-y-2.5 bg-[#0a0f1c]">
        <div className="glass-card-uees p-3 rounded-2xl flex items-center justify-between border border-white/10">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
              {loggedUser.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{loggedUser}</p>
              <p className="text-[10px] text-emerald-400 flex items-center font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block animate-pulse shrink-0" />
                En línea
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerCelebration}
            className="p-1.5 rounded-lg text-gray-400 hover:text-pink-400 transition-colors cursor-pointer shrink-0"
            title="Celebrar logro académico"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
