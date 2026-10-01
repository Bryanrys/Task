import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  ExternalLink,
  FileDown,
  FileUp,
  Cloud,
  Download,
  Upload,
  Link as LinkIcon,
  Calculator,
  Timer,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import {
  ClassSlot,
  DAYS,
  DEFAULT_SCHEDULE,
  SCHEDULE_STORAGE_KEY,
} from './ClassScheduleModal';
import {
  UniversityLinkItem,
  DEFAULT_LINKS,
  LINKS_STORAGE_KEY,
} from './UniversityLinksModal';

interface ToolsAndLinksViewProps {
  isDark: boolean;
  cloudStatus: string;
  accessCode: string;
  startDate: string;
  daysElapsed: number;
  pendingTasksCount: number;
  onBackToTasks: () => void;
  onExportJSON: () => void;
  onImportJSONClick: () => void;
  onOpenSchedule: () => void;
  onOpenLinks: () => void;
  onOpenGrades: () => void;
  onOpenPomodoro: () => void;
  onOpenStartDate: () => void;
  onUploadCloud: () => void;
  onDownloadCloud: () => void;
  onCopyLink: () => void;
  onOpenShareModal: () => void;
}

export const ToolsAndLinksView: React.FC<ToolsAndLinksViewProps> = ({
  isDark,
  cloudStatus,
  accessCode,
  startDate,
  daysElapsed,
  pendingTasksCount,
  onBackToTasks,
  onExportJSON,
  onImportJSONClick,
  onOpenSchedule,
  onOpenLinks,
  onOpenGrades,
  onOpenPomodoro,
  onOpenStartDate,
  onUploadCloud,
  onDownloadCloud,
  onCopyLink,
  onOpenShareModal,
}) => {
  // Read schedule for quick today preview
  const [schedule, setSchedule] = useState<ClassSlot[]>(() => {
    try {
      const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCHEDULE;
  });

  // Read university links for direct quick buttons
  const [links, setLinks] = useState<UniversityLinkItem[]>(() => {
    try {
      const saved = localStorage.getItem(LINKS_STORAGE_KEY);
      if (saved) {
        const parsed: UniversityLinkItem[] = JSON.parse(saved);
        return parsed.map((item) =>
          item.url.includes('drive.google.com')
            ? { ...item, title: item.title.includes('Google') ? 'OneDrive Proyectos UEES' : item.title, url: 'https://onedrive.live.com' }
            : item
        );
      }
    } catch {}
    return DEFAULT_LINKS;
  });

  // Sync when storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const savedSched = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (savedSched) setSchedule(JSON.parse(savedSched));
        const savedLinks = localStorage.getItem(LINKS_STORAGE_KEY);
        if (savedLinks) {
          const parsed: UniversityLinkItem[] = JSON.parse(savedLinks);
          setLinks(
            parsed.map((item) =>
              item.url.includes('drive.google.com')
                ? { ...item, title: item.title.includes('Google') ? 'OneDrive Proyectos UEES' : item.title, url: 'https://onedrive.live.com' }
                : item
            )
          );
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('academic_data_synced', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('academic_data_synced', handleStorageUpdate);
    };
  }, []);

  // Determine current day for schedule preview
  const dayIndex = new Date().getDay(); // 0: Dom, 1: Lun ... 6: Sab
  const currentDayName = dayIndex >= 1 && dayIndex <= 6 ? DAYS[dayIndex - 1] : 'LUNES';
  const todayClasses = schedule.filter((s) => s.day === currentDayName);

  return (
    <div className="space-y-4 pb-6">
      {/* Return to Tasks Navigation Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={onBackToTasks}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs ${
            isDark
              ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.15)]'
              : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4 animate-pulse" />
          <span>← Volver a Tareas Pendientes</span>
          {pendingTasksCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono">
              {pendingTasksCount}
            </span>
          )}
        </button>

        <span className={`text-[11px] font-mono font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          👉 Desliza a la izquierda
        </span>
      </motion.div>

      {/* Grid: JSON & Cloud Database Backup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className={`rounded-3xl p-5 border transition-all ${
          isDark
            ? 'bg-[#181614]/90 border-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
            : 'bg-white border-emerald-200 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-sm uppercase tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                Copia de Seguridad JSON
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Descarga o restaura tus semanas, tareas, notas y horario
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
            .JSON
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={onExportJSON}
            className={`p-3.5 rounded-2xl border flex items-center justify-between font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 shadow-xs'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileDown className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="font-extrabold">Descargar Respaldo JSON</div>
                <div className={`text-[10px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Guardar archivo en este dispositivo
                </div>
              </div>
            </div>
            <span className="text-xs">💾</span>
          </button>

          <button
            onClick={onImportJSONClick}
            className={`p-3.5 rounded-2xl border flex items-center justify-between font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shadow-xs'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileUp className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="font-extrabold">Cargar Respaldo JSON</div>
                <div className={`text-[10px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Restaurar archivo .json previo
                </div>
              </div>
            </div>
            <span className="text-xs">📂</span>
          </button>
        </div>
      </motion.div>

      {/* Class Schedule Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl p-5 border transition-all ${
          isDark
            ? 'bg-[#181614]/90 border-cyan-500/25 shadow-[0_0_30px_rgba(6,182,212,0.08)]'
            : 'bg-white border-cyan-200 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm uppercase tracking-wide ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  Horario de Clases
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                }`}>
                  Hoy: {currentDayName}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {todayClasses.length > 0 ? `${todayClasses.length} materias programadas para hoy` : 'No hay clases programadas para hoy'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSchedule}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25'
                : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
            }`}
          >
            Ver Todo / Editar
          </button>
        </div>

        {/* Classes of today preview list */}
        <div className="space-y-2 mb-3">
          {todayClasses.length > 0 ? (
            todayClasses.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-stone-200'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-extrabold text-xs tracking-wide truncate">
                    {item.subjectName}
                  </div>
                  <div className={`text-[10px] flex items-center gap-2 mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {item.timeRange}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 ${
                  isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                }`}>
                  CLASE
                </span>
              </div>
            ))
          ) : (
            <div className={`p-3 text-center rounded-2xl border text-xs italic ${
              isDark ? 'border-white/5 text-stone-500 bg-white/[0.02]' : 'border-stone-200 text-stone-400 bg-stone-50'
            }`}>
              🎉 ¡Día libre o sin clases registradas para {currentDayName}! Toca "Ver Todo / Editar" para configurar tu horario semanal.
            </div>
          )}
        </div>
      </motion.div>

      {/* University Links Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className={`rounded-3xl p-5 border transition-all ${
          isDark
            ? 'bg-[#181614]/90 border-violet-500/25 shadow-[0_0_30px_rgba(168,85,247,0.08)]'
            : 'bg-white border-violet-200 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-sm uppercase tracking-wide ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>
                Enlaces Universitarios UEES
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Acceso directo a portales, aulas virtuales y recursos
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLinks}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-violet-500/15 border-violet-400/40 text-violet-300 hover:bg-violet-500/25'
                : 'bg-violet-50 border-violet-300 text-violet-800 hover:bg-violet-100'
            }`}
          >
            Administrar
          </button>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {links.slice(0, 6).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer active:scale-95 hover:scale-[1.02] ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 hover:border-violet-400/40 text-stone-200 shadow-xs'
                  : 'bg-stone-50 border-stone-200 hover:border-violet-300 text-stone-800 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-violet-400' : 'text-violet-700'
                }`}>
                  {item.category}
                </span>
                <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
              </div>
              <div className="text-xs font-bold line-clamp-2">
                {item.title}
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Cloud Database (Supabase Sync) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-3xl p-5 border transition-all ${
          isDark
            ? 'bg-[#181614]/90 border-blue-500/25 shadow-[0_0_30px_rgba(59,130,246,0.08)]'
            : 'bg-white border-blue-200 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-sm uppercase tracking-wide ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                Base de Datos y Nube (Supabase)
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Sincronización remota para mantener tus datos en cualquier parte
              </p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}>
            {cloudStatus}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={onUploadCloud}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-blue-500/15 border-blue-400/40 text-blue-300 hover:bg-blue-500/25'
                : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Guardar en Nube</span>
          </button>

          <button
            onClick={onDownloadCloud}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-stone-200 hover:bg-white/[0.08]'
                : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar Nube</span>
          </button>

          <button
            onClick={onCopyLink}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-yellow-300 hover:bg-white/[0.08]'
                : 'bg-stone-50 border-stone-200 text-amber-700 hover:bg-stone-100'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Código: {accessCode}</span>
          </button>
        </div>
      </motion.div>

      {/* Academic Utilities Grid (Promedios, Pomodoro, Ciclo) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {/* Promedios */}
        <button
          onClick={onOpenGrades}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#181614]/90 border-amber-500/25 hover:border-amber-400/50 shadow-xs'
              : 'bg-white border-amber-200 hover:border-amber-400 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Cálculo</span>
          </div>
          <div className="font-extrabold text-xs text-amber-400 uppercase">Calculadora Promedios</div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Calcula notas y proyecciones de parciales
          </p>
        </button>

        {/* Pomodoro */}
        <button
          onClick={onOpenPomodoro}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#181614]/90 border-rose-500/25 hover:border-rose-400/50 shadow-xs'
              : 'bg-white border-rose-200 hover:border-rose-400 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Timer className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">Enfoque</span>
          </div>
          <div className="font-extrabold text-xs text-rose-400 uppercase">Pomodoro Timer</div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Sesiones de estudio de 25 min + descansos
          </p>
        </button>

        {/* Start Date & Days Elapsed */}
        <button
          onClick={onOpenStartDate}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#181614]/90 border-yellow-500/25 hover:border-yellow-400/50 shadow-xs'
              : 'bg-white border-yellow-200 hover:border-yellow-400 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase text-yellow-400 font-bold">Ciclo</span>
          </div>
          <div className="font-extrabold text-xs text-yellow-400 uppercase">{daysElapsed} Días Transcurridos</div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Inicio: {startDate} (toca para editar)
          </p>
        </button>
      </motion.div>

      {/* Share APK / Web App Modal Button */}
      <div className="pt-2 text-center">
        <button
          onClick={onOpenShareModal}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20'
              : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Compartir Dashboard o Abrir en Navegador</span>
        </button>
      </div>
    </div>
  );
};
