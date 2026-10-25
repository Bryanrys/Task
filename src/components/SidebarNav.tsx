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
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { SubjectItem } from '../types';

interface SidebarNavProps {
  currentView: 'dashboard' | 'schedule' | 'cloud';
  onSwitchView: (view: 'dashboard' | 'schedule' | 'cloud') => void;
  subjects: SubjectItem[];
  totalWeeksCount: number;
  activeWeekNumber?: number;
  selectedSubjectId?: string | null;
  onSelectSubject?: (subjectId: string | null) => void;
  loggedUser?: string;
  onScrollToSubject: (subjectId: string) => void;
  onOpenWeeks: () => void;
  onOpenPomodoro: () => void;
  onOpenCalculator: () => void;
  onOpenAIAssistant?: () => void;
  onTriggerCelebration: () => void;
  onLogout: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  isDark?: boolean;
  themeMode?: 'system' | 'dark' | 'light';
  onCycleTheme?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentView,
  onSwitchView,
  subjects,
  totalWeeksCount,
  activeWeekNumber,
  selectedSubjectId,
  onSelectSubject,
  loggedUser = 'Estudiante UEES',
  onScrollToSubject,
  onOpenWeeks,
  onOpenPomodoro,
  onOpenCalculator,
  onOpenAIAssistant,
  onTriggerCelebration,
  onLogout,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  isDark = true,
  themeMode = 'system',
  onCycleTheme,
}) => {
  const getSubjectIcon = (name: string, index: number) => {
    const n = name.toLowerCase();
    if (n.includes('progra') || n.includes('web') || n.includes('codigo') || n.includes('code')) {
      return <Code2 className="w-4 h-4 text-zinc-400" />;
    }
    if (n.includes('mate') || n.includes('calculo') || n.includes('algebra')) {
      return <Binary className="w-4 h-4 text-zinc-400" />;
    }
    if (n.includes('fisi') || n.includes('quim') || n.includes('ciencia')) {
      return <Atom className="w-4 h-4 text-zinc-400" />;
    }
    return <BookOpen className="w-4 h-4 text-zinc-400" />;
  };

  const getSubjectDotColor = (index: number) => {
    const dots = ['bg-zinc-400', 'bg-zinc-500', 'bg-emerald-500', 'bg-zinc-400', 'bg-zinc-600'];
    return dots[index % dots.length];
  };

  return (
    <aside
      className={`transition-colors duration-200 border-r flex flex-col justify-between shrink-0 select-none ${
        isDark
          ? 'bg-[#0c0d10] border-white/5 text-zinc-100'
          : 'bg-[#ffffff] md:bg-[#fbfbf9] border-zinc-200/80 text-zinc-900'
      } ${
        isMobileDrawer
          ? 'w-72 h-full shadow-2xl p-0'
          : 'hidden md:flex md:w-64 min-h-screen'
      }`}
    >
      <div className="p-5 space-y-6 overflow-y-auto">
        {/* Brand / Logo Header */}
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
            isDark ? 'bg-white !text-black text-black font-black' : 'bg-black !text-white text-white font-black'
          }`}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-xs font-black tracking-widest uppercase ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}>
              REYES ALVARADO
            </h2>
            <p className={`text-[10px] font-mono ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>UEES Dashboard</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1 pt-1">
          <button
            onClick={() => {
              onSwitchView('dashboard');
              if (onSelectSubject) onSelectSubject(null);
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              currentView === 'dashboard' && !selectedSubjectId
                ? isDark
                  ? 'bg-white !text-black text-black shadow-sm'
                  : 'bg-black !text-white text-white shadow-sm'
                : isDark
                ? 'text-zinc-300 hover:text-white hover:bg-white/10'
                : 'text-zinc-700 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <PieChart className={`w-4 h-4 shrink-0 stroke-[2.2] ${
              currentView === 'dashboard' && !selectedSubjectId
                ? isDark ? '!text-black text-black' : '!text-white text-white'
                : isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`} />
            <span className="font-bold">Dashboard Principal</span>
          </button>

          <button
            onClick={() => {
              onSwitchView('schedule');
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              currentView === 'schedule'
                ? isDark
                  ? 'bg-white !text-black text-black shadow-sm'
                  : 'bg-black !text-white text-white shadow-sm'
                : isDark
                ? 'text-zinc-300 hover:text-white hover:bg-white/10'
                : 'text-zinc-700 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <Calendar className={`w-4 h-4 shrink-0 stroke-[2.2] ${
              currentView === 'schedule'
                ? isDark ? '!text-black text-black' : '!text-white text-white'
                : isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`} />
            <span className="font-bold">Horario & Clases</span>
          </button>

          <button
            onClick={() => {
              onSwitchView('cloud');
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              currentView === 'cloud'
                ? isDark
                  ? 'bg-white !text-black text-black shadow-sm'
                  : 'bg-black !text-white text-white shadow-sm'
                : isDark
                ? 'text-zinc-300 hover:text-white hover:bg-white/10'
                : 'text-zinc-700 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <CloudUpload className={`w-4 h-4 shrink-0 stroke-[2.2] ${
              currentView === 'cloud'
                ? isDark ? '!text-black text-black' : '!text-white text-white'
                : isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`} />
            <span className="font-bold">Base de Datos Nube</span>
          </button>
        </nav>

        {/* Materias del Ciclo */}
        <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-white/5' : 'border-zinc-200/80'}`}>
          <div className="flex items-center justify-between px-3">
            <p className={`text-[10px] font-extrabold uppercase tracking-wider font-mono ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Materias Ciclo
            </p>
            {selectedSubjectId && (
              <button
                onClick={() => {
                  if (onSelectSubject) onSelectSubject(null);
                  onSwitchView('dashboard');
                }}
                className={`text-[10px] font-mono underline cursor-pointer ${
                  isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'
                }`}
              >
                Ver todas
              </button>
            )}
          </div>
          <div className="space-y-1">
            {subjects.map((s, idx) => {
              const isSelected = selectedSubjectId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onSwitchView('dashboard');
                    if (onSelectSubject) {
                      onSelectSubject(s.id);
                    } else {
                      onScrollToSubject(s.id);
                    }
                    if (onCloseMobileDrawer) onCloseMobileDrawer();
                  }}
                  className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer group ${
                    isSelected
                      ? isDark
                        ? 'bg-white/10 text-white font-bold border border-white/15'
                        : 'bg-zinc-200/80 text-zinc-900 font-bold border border-zinc-300/80'
                      : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                  title={`Abrir actividades de ${s.name}`}
                >
                  <span className="flex items-center space-x-2.5 truncate pr-2">
                    {getSubjectIcon(s.name, idx)}
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className={`w-2 h-2 rounded-full ${getSubjectDotColor(idx)} shrink-0`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Utilidades */}
        <div className={`pt-3 border-t space-y-1.5 ${isDark ? 'border-white/5' : 'border-zinc-200/80'}`}>
          <p className={`text-[10px] font-extrabold uppercase tracking-wider px-3 font-mono ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Utilidades
          </p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenWeeks();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>Semanas ({activeWeekNumber ? `Sem. ${activeWeekNumber} activa` : `${totalWeeksCount} Sem.`})</span>
            </button>

            <button
              onClick={() => {
                onOpenPomodoro();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Timer className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Pomodoro Timer</span>
            </button>

            <button
              onClick={() => {
                onOpenCalculator();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Calculator className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Notas y Promedios UEES</span>
            </button>

            <button
              onClick={() => {
                if (onOpenAIAssistant) onOpenAIAssistant();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'text-zinc-200 hover:text-white bg-white/5 border-white/10 hover:border-white/20'
                  : 'text-zinc-800 hover:text-zinc-950 bg-zinc-100/80 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>KALI • Copiloto IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Footer Profile & Theme Toggle */}
      <div className={`p-4 border-t space-y-2.5 ${isDark ? 'border-white/5 bg-[#0e0f12]' : 'border-zinc-200/80 bg-zinc-50'}`}>
        {/* Theme mode button */}
        {onCycleTheme && (
          <button
            onClick={onCycleTheme}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                : 'bg-white hover:bg-zinc-50 border-zinc-300 text-black shadow-xs'
            }`}
            title="Cambiar modo de tema (Sistema / Oscuro / Claro)"
          >
            <div className="flex items-center gap-2">
              {themeMode === 'system' ? (
                <Laptop className="w-3.5 h-3.5 text-emerald-500" />
              ) : isDark ? (
                <Moon className="w-3.5 h-3.5 text-zinc-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-zinc-700" />
              )}
              <span>
                {themeMode === 'system'
                  ? `Tema: Auto (${isDark ? 'Oscuro' : 'Claro'})`
                  : themeMode === 'dark'
                  ? 'Tema: Modo Oscuro'
                  : 'Tema: Modo Claro'}
              </span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
              isDark ? 'bg-white/15 text-white' : 'bg-zinc-200 text-black'
            }`}>
              {themeMode === 'system' ? 'AUTO' : themeMode === 'dark' ? 'DARK' : 'LIGHT'}
            </span>
          </button>
        )}

        <div className={`p-2.5 rounded-2xl flex items-center justify-between border ${
          isDark ? 'bg-[#131417] border-white/10' : 'bg-white border-zinc-300 shadow-xs'
        }`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              isDark ? 'bg-zinc-800 text-white' : 'bg-black text-white'
            }`}>
              {loggedUser.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{loggedUser}</p>
              <p className="text-[10px] text-emerald-500 flex items-center font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block animate-pulse shrink-0" />
                En línea
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerCelebration}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'
            }`}
            title="Celebrar logro académico"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </button>
        </div>

        <button
          onClick={onLogout}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30'
              : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
