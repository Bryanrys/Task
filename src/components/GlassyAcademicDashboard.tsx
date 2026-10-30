/**
 * GlassyAcademicDashboard.tsx
 * Adaptación de ultra-alta fidelidad basada en Glassy Dashboard V5 (Spatial Glassmorphism)
 * Integrado 100% con los datos reales de 'Mi Ciclo Académico (UEES)'.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  GraduationCap,
  Timer,
  CheckCircle2,
  Calendar,
  Sparkles,
  Cloud,
  Layers,
  Settings,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Clock,
  User,
  Sliders,
  Share2,
  Folder,
  FileText,
  Bookmark,
  MapPin,
  Heart,
  Eye,
  LogOut,
  RefreshCw,
  Code2,
  Atom,
  Binary,
  MessageSquare,
} from 'lucide-react';
import { Dashboard, WeekItem, SubjectItem, TaskItem } from '../types';

interface GlassyAcademicDashboardProps {
  currentDashboard: Dashboard;
  dashboards: Dashboard[];
  currentWeek: WeekItem | null;
  isParcialWeek: boolean;
  loggedUser: string;
  isSyncing: boolean;
  layoutMode: 'glassy' | 'classic';
  onToggleLayoutMode: () => void;
  onSelectWeek: (weekId: string) => void;
  onAddWeek: () => void;
  onToggleTask: (subjectId: string, taskId: string) => void;
  onOpenDrawer: () => void;
  onOpenPensum: () => void;
  onOpenGradeCalculator: () => void;
  onOpenPomodoro: () => void;
  onOpenAI: () => void;
  onOpenSchedule: () => void;
  onOpenLinks: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onSyncCloud: () => void;
  onLogout: () => void;
  daysElapsed?: number;
}

export const GlassyAcademicDashboard: React.FC<GlassyAcademicDashboardProps> = ({
  currentDashboard,
  dashboards,
  currentWeek,
  isParcialWeek,
  loggedUser,
  isSyncing,
  layoutMode,
  onToggleLayoutMode,
  onSelectWeek,
  onAddWeek,
  onToggleTask,
  onOpenDrawer,
  onOpenPensum,
  onOpenGradeCalculator,
  onOpenPomodoro,
  onOpenAI,
  onOpenSchedule,
  onOpenLinks,
  onOpenSettings,
  onOpenShare,
  onSyncCloud,
  onLogout,
  daysElapsed = 84,
}) => {
  const [activeTab, setActiveTab] = useState<'ciclo' | 'materias'>('ciclo');
  const [showMullions, setShowMullions] = useState<boolean>(true);
  const [blurValue, setBlurValue] = useState<number>(38);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estadísticas reales calculadas de la semana actual
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;

    if (currentWeek && currentWeek.subjectTasks) {
      Object.values(currentWeek.subjectTasks).forEach((taskList) => {
        taskList.forEach((t) => {
          totalTasks++;
          if (t.completed) completedTasks++;
        });
      });
    }

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      totalTasks,
      completedTasks,
      percentage,
      activeSubjectsCount: currentDashboard.subjects.length,
    };
  }, [currentWeek, currentDashboard]);

  // Actualizar Blur CSS
  const handleBlurChange = (val: number) => {
    setBlurValue(val);
    document.documentElement.style.setProperty('--glass-blur', `${val}px`);
  };

  // Obtener ícono temático por materia
  const getSubjectIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('base') || n.includes('datos') || n.includes('sql')) {
      return <Binary className="w-5 h-5 text-emerald-400" />;
    }
    if (n.includes('programaci') || n.includes('código') || n.includes('software')) {
      return <Code2 className="w-5 h-5 text-sky-400" />;
    }
    if (n.includes('matemát') || n.includes('cálculo') || n.includes('álgebra')) {
      return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
    if (n.includes('físic')) {
      return <Atom className="w-5 h-5 text-purple-400" />;
    }
    return <BookOpen className="w-5 h-5 text-rose-400" />;
  };

  const getSubjectAccentColor = (idx: number) => {
    const colors = [
      'border-t-emerald-400',
      'border-t-sky-400',
      'border-t-amber-400',
      'border-t-purple-400',
      'border-t-rose-400',
      'border-t-indigo-400',
    ];
    return colors[idx % colors.length];
  };

  // Filtrar materias si hay búsqueda
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return currentDashboard.subjects;
    return currentDashboard.subjects.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentDashboard.subjects, searchQuery]);

  return (
    <div className="penthouse-environment text-white min-h-screen antialiased select-none pb-16 relative overflow-x-hidden">
      
      {/* Travesaños y Columnas de Ventanales Arquitectónicos para Refracción de Luz */}
      {showMullions && <div className="window-mullions" />}

      {/* BARRA SUPERIOR DE CALIBRACIÓN Y MODO */}
      <header className="bg-black/75 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-white tracking-wider uppercase text-[11px]">
            Glassy Dashboard V5 · {currentDashboard.name}
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            Spatial UI Activo
          </span>
        </div>

        {/* Control de Blur y Botón de Alternancia de Vistas */}
        <div className="flex items-center gap-3">
          {/* Calibrador de Blur */}
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <span className="text-white/70 text-[11px] font-medium flex items-center gap-1">
              Blur: <strong className="text-emerald-400">{blurValue}px</strong>
            </span>
            <input
              type="range"
              min="15"
              max="65"
              value={blurValue}
              onChange={(e) => handleBlurChange(Number(e.target.value))}
              className="w-20 accent-emerald-400 cursor-pointer"
              title="Ajustar desenfoque del cristal"
            />
          </div>

          {/* Toggle de Marcos de Ventana */}
          <button
            onClick={() => setShowMullions(!showMullions)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-[11px] border border-white/10 transition"
            title="Activar/desactivar marcos de ventana"
          >
            🪟 {showMullions ? 'Ventanales: ON' : 'Ventanales: OFF'}
          </button>

          {/* INTERRUPTOR DE SEGURIDAD 1-CLICK: VOLVER A VISTA CLÁSICA */}
          <button
            onClick={onToggleLayoutMode}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 text-amber-200 border border-amber-400/40 text-[11px] font-bold flex items-center gap-1.5 transition shadow-lg"
            title="Alternar entre Vista Glassy V5 y Vista Clásica"
          >
            🏛️ Vista Clásica
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative z-20 max-w-7xl mx-auto px-3 sm:px-6 pt-5">

        {/* TOP HEADER FLOTANTE (ESTILO VISIONOS / MACOS) */}
        <div className="flex items-center justify-between gap-3 mb-6">
          
          {/* Izquierda: Drawer de Dashboards y Pensum */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDrawer}
              className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:scale-105 transition shadow-lg"
              title="Mis Dashboards / Colección"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPensum}
              className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:scale-105 transition shadow-lg"
              title="Malla Curricular / Pensum"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={onSyncCloud}
              className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:scale-105 transition shadow-lg"
              title="Sincronizar con Supabase Cloud"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>

          {/* Centro: Cápsula Flotante con Pestañas Principales */}
          <nav className="liquid-glass px-2 py-1.5 rounded-full flex items-center gap-1 shadow-2xl">
            <button
              onClick={() => setActiveTab('ciclo')}
              className={`glass-pill-dock ${activeTab === 'ciclo' ? 'active' : ''} px-4 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Mi Ciclo</span>
            </button>
            <button
              onClick={() => setActiveTab('materias')}
              className={`glass-pill-dock ${activeTab === 'materias' ? 'active' : ''} px-4 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white flex items-center gap-2`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Materias ({currentDashboard.subjects.length})</span>
            </button>
            <button
              onClick={onOpenGradeCalculator}
              className="glass-pill-dock px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Calculadora CUM</span>
            </button>
            <button
              onClick={onOpenPomodoro}
              className="glass-pill-dock px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white flex items-center gap-1.5"
            >
              <Timer className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Pomodoro</span>
            </button>
          </nav>

          {/* Derecha: Tutor IA, Notificaciones y Perfil */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAI}
              className="liquid-glass relative w-10 h-10 rounded-full flex items-center justify-center text-sky-400 hover:text-sky-300 hover:scale-105 transition shadow-lg"
              title="Tutor IA Gemini"
            >
              <Sparkles className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-sky-400 rounded-full shadow-lg shadow-sky-400/50" />
            </button>
            <button
              onClick={onOpenSchedule}
              className="liquid-glass relative w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:scale-105 transition shadow-lg"
              title="Horario de Clases"
            >
              <Calendar className="w-4 h-4" />
              {stats.totalTasks - stats.completedTasks > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-[9px] font-bold rounded-full flex items-center justify-center text-black">
                  {stats.totalTasks - stats.completedTasks}
                </span>
              )}
            </button>
            {/* Avatar Usuario con punto de conexión */}
            <div
              onClick={onOpenSettings}
              className="relative cursor-pointer hover:scale-105 transition"
              title={`${loggedUser} · Opciones de perfil`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white uppercase">
                  {loggedUser ? loggedUser.substring(0, 2) : 'UE'}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-black rounded-full" />
            </div>
          </div>

        </div>

        {/* LAYOUT: DOCK LATERAL FLOTANTE + CONTENIDO */}
        <div className="flex items-start gap-4 sm:gap-6">
          
          {/* DOCK VERTICAL FLOTANTE (Izquierda) */}
          <aside className="liquid-glass p-2 rounded-full flex flex-col items-center gap-3 shadow-2xl shrink-0 sticky top-20">
            {/* Home / Mi Ciclo */}
            <button
              onClick={() => setActiveTab('ciclo')}
              className={`glass-pill-dock ${activeTab === 'ciclo' ? 'active' : ''} w-11 h-11 rounded-full flex items-center justify-center text-white transition`}
              title="Mi Ciclo Académico"
            >
              <GraduationCap className="w-5 h-5" />
            </button>

            {/* Materias */}
            <div className="relative group">
              <button
                onClick={() => setActiveTab('materias')}
                className={`glass-pill-dock ${activeTab === 'materias' ? 'active' : ''} w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white transition`}
                title="Catálogo de Materias"
              >
                <BookOpen className="w-5 h-5" />
              </button>
              <span className="absolute left-14 top-1/2 -translate-y-1/2 liquid-glass px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-xl">
                Materias Activas
              </span>
            </div>

            {/* Calculadora CUM */}
            <button
              onClick={onOpenGradeCalculator}
              className="glass-pill-dock w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white transition"
              title="Calculadora CUM UEES"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
            </button>

            {/* Pomodoro */}
            <button
              onClick={onOpenPomodoro}
              className="glass-pill-dock w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white transition"
              title="Temporizador Pomodoro"
            >
              <Timer className="w-5 h-5 text-sky-400" />
            </button>

            {/* Horario */}
            <button
              onClick={onOpenSchedule}
              className="glass-pill-dock w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white transition"
              title="Horario de Clases"
            >
              <Calendar className="w-5 h-5" />
            </button>

            {/* Tutor IA */}
            <button
              onClick={onOpenAI}
              className="glass-pill-dock w-11 h-11 rounded-full flex items-center justify-center text-sky-400 hover:text-sky-300 transition"
              title="Tutor Académico IA"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Enlaces Universitarios */}
            <button
              onClick={onOpenLinks}
              className="glass-pill-dock w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white transition"
              title="Portales Universitarios"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          </aside>

          {/* ÁREA DE CONTENIDO */}
          <main className="flex-1 min-w-0">

            {/* ==================== VISTA 1: DASHBOARD MI CICLO ==================== */}
            {activeTab === 'ciclo' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                
                {/* ENCABEZADO CON SALUDO Y SELECTOR DE SEMANAS */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        {currentDashboard.name}
                      </span>
                      <span className="text-xs text-white/50">Inicio: {currentDashboard.startDate}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-lg mt-1">
                      Hola, {loggedUser}
                    </h1>
                    <p className="text-sm text-white/60">
                      {currentWeek ? `Semana ${currentWeek.weekNumber} (${currentWeek.dateRange})` : 'Semana activa'} ·{' '}
                      <span className="text-emerald-300 font-medium">
                        {currentWeek?.status || 'En proceso'}
                      </span>
                    </p>
                  </div>

                  {/* Selector de Semanas con Píldoras Glass */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="liquid-glass p-1 rounded-full flex items-center text-xs overflow-x-auto max-w-[280px] sm:max-w-none">
                      {currentDashboard.weeks.slice(0, 5).map((w) => (
                        <button
                          key={w.id}
                          onClick={() => onSelectWeek(w.id)}
                          className={`week-btn px-3 py-1 rounded-full font-semibold transition ${
                            currentWeek?.id === w.id
                              ? 'glass-pill-dock active text-white'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          Sem {w.weekNumber}
                        </button>
                      ))}
                      {currentDashboard.weeks.length > 5 && (
                        <button
                          onClick={() => onSelectWeek(currentDashboard.weeks[5].id)}
                          className="px-2.5 py-1 rounded-full text-rose-300 font-bold hover:text-white text-xs"
                          title="Semana de Parciales"
                        >
                          Sem 6 ✍️
                        </button>
                      )}
                    </div>
                    <button
                      onClick={onAddWeek}
                      className="liquid-glass px-3.5 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 hover:scale-105 transition shadow-lg bg-emerald-500/20 border-emerald-500/30"
                      title="Agregar nueva semana académica"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Semana</span>
                    </button>
                  </div>
                </div>

                {/* 4 TARJETAS KPIS CON ESTÉTICA EXACTA DEL VIDEO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* KPI 1: Materias Inscritas */}
                  <div
                    onClick={() => setActiveTab('materias')}
                    className="liquid-glass-card p-5 rounded-2xl relative overflow-hidden group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-white/40 group-hover:text-white/80 transition text-sm">↗</span>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-xs font-medium text-white/60">Materias Inscritas</p>
                        <h2 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
                          {stats.activeSubjectsCount}
                        </h2>
                        <div className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold mt-1 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Todas cursando
                        </div>
                      </div>
                      <svg className="w-24 h-10 opacity-70 group-hover:opacity-100 transition" viewBox="0 0 100 30">
                        <path d="M0,22 Q25,8 50,18 T100,6" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 2: Promedio CUM Estimado */}
                  <div
                    onClick={onOpenGradeCalculator}
                    className="liquid-glass-card p-5 rounded-2xl relative overflow-hidden group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="text-white/40 group-hover:text-white/80 transition text-sm">↗</span>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-xs font-medium text-white/60">Promedio CUM</p>
                        <h2 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">8.9</h2>
                        <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <ArrowUpRight className="w-3 h-3" />
                          +0.4 Cómputo
                        </div>
                      </div>
                      <svg className="w-24 h-10 opacity-70 group-hover:opacity-100 transition" viewBox="0 0 100 30">
                        <path d="M0,24 Q30,14 60,19 T100,4" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 3: Horas Pomodoro / Concentrado */}
                  <div
                    onClick={onOpenPomodoro}
                    className="liquid-glass-card p-5 rounded-2xl relative overflow-hidden group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-md shadow-sky-500/10">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-white/40 group-hover:text-white/80 transition text-sm">↗</span>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-xs font-medium text-white/60">Horas Pomodoro</p>
                        <h2 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">42h</h2>
                        <div className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-semibold mt-1 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/30">
                          <ArrowUpRight className="w-3 h-3" />
                          +6h esta sem
                        </div>
                      </div>
                      <svg className="w-24 h-10 opacity-70 group-hover:opacity-100 transition" viewBox="0 0 100 30">
                        <path d="M0,18 Q35,24 70,8 T100,12" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 4: Progreso de Tareas & Foros */}
                  <div className="liquid-glass-card p-5 rounded-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-white/40 group-hover:text-white/80 transition text-sm">↗</span>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-xs font-medium text-white/60">Tareas & Foros</p>
                        <h2 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
                          {stats.percentage}%
                        </h2>
                        <div className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-semibold mt-1 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                          {stats.completedTasks} de {stats.totalTasks} listas
                        </div>
                      </div>
                      <svg className="w-24 h-10 opacity-70 group-hover:opacity-100 transition" viewBox="0 0 100 30">
                        <path d="M0,26 Q40,6 75,18 T100,8" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                </div>

                {/* FILA CENTRAL: PRODUCTIVIDAD SEMANAL + AGENDA DE HOY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Gráfico de Barras Cilíndricas Redondeadas con Jueves Neón */}
                  <div className="lg:col-span-2 liquid-glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-bold text-white">Productividad de Estudio</h3>
                        <p className="text-xs text-white/50">Dedicación académica acumulada por día</p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +18.4% vs semana previa
                      </div>
                    </div>

                    <div className="h-56 flex items-end justify-between gap-3 sm:gap-7 pt-4 pb-2 px-2">
                      {/* Lun */}
                      <div className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div className="w-full max-w-[44px] h-[55%] rounded-full chart-pill-dim relative cursor-pointer">
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            4.5h Bases de Datos
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white/50">Lun</span>
                      </div>
                      {/* Mar */}
                      <div className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div className="w-full max-w-[44px] h-[72%] rounded-full chart-pill-dim relative cursor-pointer">
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            6.0h Matemática II
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white/50">Mar</span>
                      </div>
                      {/* Mié */}
                      <div className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div className="w-full max-w-[44px] h-[64%] rounded-full chart-pill-dim relative cursor-pointer">
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            5.5h Física II
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white/50">Mié</span>
                      </div>
                      {/* Jue (Columna Neón Eléctrica Destacada del Video) */}
                      <div className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div className="w-full max-w-[44px] h-[94%] rounded-full chart-pill-glow relative cursor-pointer">
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-sky-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap shadow-xl">
                            8.5h Programación II ★
                          </span>
                        </div>
                        <span className="text-xs font-bold text-sky-400">Jue</span>
                      </div>
                      {/* Vie */}
                      <div className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div className="w-full max-w-[44px] h-[75%] rounded-full chart-pill-dim relative cursor-pointer">
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            6.0h Redacción
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white/50">Vie</span>
                      </div>
                      {/* Sáb */}
                      <div className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div className="w-full max-w-[44px] h-[40%] rounded-full chart-pill-dim relative cursor-pointer">
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            3.0h Tareas
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white/50">Sáb</span>
                      </div>
                      {/* Dom */}
                      <div className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                        <div className="w-full max-w-[44px] h-[25%] rounded-full chart-pill-dim relative cursor-pointer">
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            2.0h Repaso
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white/50">Dom</span>
                      </div>
                    </div>
                  </div>

                  {/* AGENDA ACADÉMICA DE HOY */}
                  <div className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-white">Agenda de Hoy</h3>
                          <p className="text-xs text-white/50">Clases & Entregas próximas</p>
                        </div>
                        <button
                          onClick={onOpenSchedule}
                          className="liquid-glass w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white"
                          title="Ver horario completo"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              Programación II
                            </span>
                            <span className="text-white/50 text-[11px]">07:00 - 08:40</span>
                          </div>
                          <span className="text-[11px] text-sky-300 font-medium">Lab 3 · React & TypeScript</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              Matemática II
                            </span>
                            <span className="text-white/50 text-[11px]">09:00 - 10:40</span>
                          </div>
                          <span className="text-[11px] text-amber-300 font-medium">Aula Magna · Integrales</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              Bases de Datos I
                            </span>
                            <span className="text-emerald-400 font-semibold text-[10px]">Vence Hoy 23:59</span>
                          </div>
                          <span className="text-[11px] text-white/70">Entrega de Foro: Normalización 3FN</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-400" />
                              Física II
                            </span>
                            <span className="text-white/50 text-[11px]">16:00 - 17:30</span>
                          </div>
                          <span className="text-[11px] text-white/60">Sesión Pomodoro · Ley de Coulomb</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* SECCIÓN DE TUS MATERIAS ACTIVAS CON SUS TAREAS REALES */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Materias Activas ({currentWeek ? `Semana ${currentWeek.weekNumber}` : 'Semana 1'})
                      </h3>
                      <p className="text-xs text-white/50">Marca tareas y foros entregados en tiempo real</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('materias')}
                      className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                    >
                      Ver detalle de asignaturas <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentDashboard.subjects.map((subj, idx) => {
                      const tasks = currentWeek?.subjectTasks[subj.id] || [];
                      const doneCount = tasks.filter((t) => t.completed).length;
                      const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

                      return (
                        <div
                          key={subj.id}
                          className={`liquid-glass-card p-5 rounded-2xl relative border-t-2 ${getSubjectAccentColor(
                            idx
                          )}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {getSubjectIcon(subj.name)}
                              <span className="text-xs font-bold text-white truncate">{subj.name}</span>
                            </div>
                            <span className="text-[10px] font-semibold bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/15 shrink-0">
                              {isParcialWeek ? 'Examen Parcial' : 'Cómputo 1'}
                            </span>
                          </div>

                          <div className="space-y-2 mt-3">
                            {tasks.map((task) => (
                              <label
                                key={task.id}
                                className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer hover:text-white transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => onToggleTask(subj.id, task.id)}
                                  className="glass-checkbox"
                                />
                                <span className={task.completed ? 'line-through text-white/40' : 'text-white/90'}>
                                  {task.name}
                                </span>
                              </label>
                            ))}
                            {tasks.length === 0 && (
                              <p className="text-xs text-white/40 italic">No hay tareas programadas esta semana.</p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
                            <span>Avance: {pct}%</span>
                            <span className={pct === 100 ? 'text-emerald-400 font-bold' : 'text-sky-300'}>
                              {pct === 100 ? '¡Al día! ✨' : `${doneCount} / ${tasks.length} listas`}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* TARJETA ACCESO DIRECTO AL TUTOR IA GEMINI */}
                    <div
                      onClick={onOpenAI}
                      className="liquid-glass-card p-5 rounded-2xl relative border-t-2 border-t-sky-400 cursor-pointer hover:scale-[1.02] transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Tutor Académico IA
                          </span>
                          <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">
                            En línea
                          </span>
                        </div>
                        <p className="text-xs text-white/90 font-medium mt-1">
                          ¿Dudas con Integrales o Normalización SQL?
                        </p>
                        <p className="text-[11px] text-white/50 mt-1">
                          Consulta explicaciones personalizadas según tu pensum y materias.
                        </p>
                      </div>
                      <button className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 text-xs font-bold text-white shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Consultar al Tutor
                      </button>
                    </div>

                  </div>
                </div>

              </motion.div>
            )}

            {/* ==================== VISTA 2: CATÁLOGO DE MATERIAS ==================== */}
            {activeTab === 'materias' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Catálogo de Asignaturas</h1>
                    <p className="text-xs text-white/60">
                      {currentDashboard.subjects.length} Asignaturas cursando en {currentDashboard.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar materia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <button
                      onClick={() => setActiveTab('ciclo')}
                      className="liquid-glass px-4 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 hover:scale-105 transition"
                    >
                      ← Volver a Mi Ciclo
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredSubjects.map((subj, idx) => (
                    <div key={subj.id} className="liquid-glass-card p-5 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                            {getSubjectIcon(subj.name)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{subj.name}</h3>
                            <p className="text-xs text-white/50">Materia activa · UEES 4 UV</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={onOpenGradeCalculator}
                            className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 hover:bg-emerald-500/25 transition"
                          >
                            Calcular Cómputos
                          </button>
                          <button
                            onClick={onOpenPomodoro}
                            className="liquid-glass px-3 py-1 rounded-lg text-xs font-medium text-white/80 hover:text-white"
                          >
                            Estudiar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
};
