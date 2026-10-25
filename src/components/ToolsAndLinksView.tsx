import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  ExternalLink,
  Cloud,
  Download,
  Upload,
  Link as LinkIcon,
  Calculator,
  Timer,
  Sparkles,
  Share2,
  Video,
  Pencil,
  ClipboardPaste,
  Check,
  X,
} from 'lucide-react';
import {
  ClassSlot,
  DAYS,
  DEFAULT_SCHEDULE,
  SCHEDULE_STORAGE_KEY,
  getTeamsUrl,
  getDisplayLocation,
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
  onOpenAIAssistant?: () => void;
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
  onOpenSchedule,
  onOpenLinks,
  onOpenGrades,
  onOpenAIAssistant,
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
    } catch { }
    return DEFAULT_SCHEDULE;
  });

  // Modal rápido para configurar enlace de Teams de una materia
  const [quickTeamsSlot, setQuickTeamsSlot] = useState<ClassSlot | null>(null);
  const [quickTeamsUrl, setQuickTeamsUrl] = useState<string>('');
  const [quickTeamsSaved, setQuickTeamsSaved] = useState<boolean>(false);

  const handleOpenQuickTeams = (slot: ClassSlot) => {
    setQuickTeamsSlot(slot);
    setQuickTeamsUrl(getTeamsUrl(slot));
    setQuickTeamsSaved(false);
  };

  const handleSaveQuickTeams = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTeamsSlot) return;

    const rawUrl = quickTeamsUrl.trim();
    const formattedUrl = rawUrl
      ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`)
      : undefined;

    const updatedSchedule = schedule.map((s) => {
      if (s.id === quickTeamsSlot.id) {
        let loc = s.location;
        if (loc && (loc.startsWith('http://') || loc.startsWith('https://') || loc.includes('teams.microsoft.com'))) {
          loc = 'Aula Virtual';
        }
        return {
          ...s,
          teamsUrl: formattedUrl,
          location: loc || 'Aula Virtual',
        };
      }
      return s;
    });

    setSchedule(updatedSchedule);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedSchedule));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('academic_data_synced'));
    setQuickTeamsSaved(true);
    setTimeout(() => {
      setQuickTeamsSlot(null);
      setQuickTeamsSaved(false);
    }, 450);
  };

  const handlePasteQuickTeams = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setQuickTeamsUrl(text.trim());
    } catch { }
  };

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
    } catch { }
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
      } catch { }
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
      {/* Class Schedule Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl p-5 border transition-all ${
          isDark
            ? 'bg-[#131417] border-white/10 shadow-lg text-white'
            : 'bg-white border-zinc-200/80 shadow-xs text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm uppercase tracking-wide ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  Horario de Clases
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                  isDark ? 'bg-white/10 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}>
                  Hoy: {currentDayName}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {todayClasses.length > 0 ? `${todayClasses.length} materias programadas para hoy` : 'No hay clases programadas para hoy'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSchedule}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/10 border-white/10 text-white hover:bg-white/15'
                : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            Ver Todo / Editar
          </button>
        </div>

        {/* Classes of today preview list */}
        <div className="space-y-2.5 mb-3">
          {todayClasses.length > 0 ? (
            todayClasses.map((item) => {
              const teamsLink = getTeamsUrl(item);
              const displayLoc = getDisplayLocation(item);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isDark
                      ? 'bg-white/[0.03] border-white/5 text-zinc-200 hover:border-white/15'
                      : 'bg-zinc-50 border-zinc-200/80 text-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs tracking-wide uppercase">
                        {item.subjectName}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold shrink-0 border ${
                        isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}>
                        CLASE
                      </span>
                    </div>

                    <div className={`text-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 ${
                      isDark ? 'text-zinc-400' : 'text-zinc-500'
                    }`}>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                        {item.timeRange}
                      </span>
                      {displayLoc && (
                        <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-[220px]">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>{displayLoc}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones: Entrar a Teams y Edición rápida */}
                  <div className="flex items-center gap-2 shrink-0">
                    {teamsLink ? (
                      <>
                        <a
                          href={teamsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer border ${
                            isDark
                              ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                              : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                          }`}
                          title="Entrar directamente a la clase en Microsoft Teams"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Entrar a Teams</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                        <button
                          onClick={() => handleOpenQuickTeams(item)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                              : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                          }`}
                          title="Cambiar o configurar enlace de Teams"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenQuickTeams(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer border ${
                          isDark
                            ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                        }`}
                        title="Configurar enlace de Microsoft Teams para esta clase"
                      >
                        <Video className="w-3.5 h-3.5 text-zinc-400" />
                        <span>+ Link Teams</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`p-3 text-center rounded-2xl border text-xs italic ${
              isDark ? 'border-white/5 text-zinc-500 bg-white/[0.02]' : 'border-zinc-200 text-zinc-400 bg-zinc-50'
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
            ? 'bg-[#131417] border-white/10 shadow-lg text-white'
            : 'bg-white border-zinc-200/80 shadow-xs text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-sm uppercase tracking-wide ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Enlaces Universitarios UEES
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Acceso directo a portales, aulas virtuales y recursos
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLinks}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/10 border-white/10 text-white hover:bg-white/15'
                : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
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
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer active:scale-95 hover:scale-[1.01] ${
                isDark
                  ? 'bg-white/[0.03] border-white/5 hover:border-white/20 text-zinc-200'
                  : 'bg-zinc-50 border-zinc-200/80 hover:border-zinc-300 text-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {item.category}
                </span>
                <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
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
            ? 'bg-[#131417] border-white/10 shadow-lg text-white'
            : 'bg-white border-zinc-200/80 shadow-xs text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-sm uppercase tracking-wide ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Base de Datos y Nube (Supabase)
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Sincronización remota para mantener tus datos en cualquier parte
              </p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
            isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
          }`}>
            {cloudStatus}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={onUploadCloud}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/10 border-white/10 text-white hover:bg-white/15'
                : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Guardar en Nube</span>
          </button>

          <button
            onClick={onDownloadCloud}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10'
                : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Descargar Nube</span>
          </button>

          <button
            onClick={onCopyLink}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10'
                : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Código: {accessCode}</span>
          </button>
        </div>
      </motion.div>

      {/* Academic Utilities Grid (Promedios, Pomodoro, Ciclo, Copiloto IA) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {/* Copiloto IA UEES */}
        <button
          onClick={onOpenAIAssistant}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#131417] border-white/10 hover:border-white/20 shadow-md text-white'
              : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs text-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-mono uppercase font-bold border px-1.5 py-0.5 rounded-md ${
              isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              Agente IA
            </span>
          </div>
          <div className="font-extrabold text-xs uppercase">KALI • Copiloto IA</div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Asistente académico, tutor de dudas y gestor de tareas
          </p>
        </button>

        {/* Promedios */}
        <button
          onClick={onOpenGrades}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#131417] border-white/10 hover:border-white/20 shadow-md text-white'
              : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs text-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <Calculator className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-mono uppercase font-bold border px-1.5 py-0.5 rounded-md ${
              isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              Oficial UEES
            </span>
          </div>
          <div className="font-extrabold text-xs uppercase">Sistema de Notas UEES</div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Consulta notas oficiales, registros (30%-30%-40%) y promedios
          </p>
        </button>

        {/* Pomodoro */}
        <button
          onClick={onOpenPomodoro}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#131417] border-white/10 hover:border-white/20 shadow-md text-white'
              : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs text-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <Timer className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-mono uppercase font-bold border px-1.5 py-0.5 rounded-md ${
              isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              Enfoque
            </span>
          </div>
          <div className="font-extrabold text-xs uppercase">Pomodoro Timer</div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Sesiones de estudio de 25 min + descansos
          </p>
        </button>

        {/* Start Date & Days Elapsed */}
        <button
          onClick={onOpenStartDate}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#131417] border-white/10 hover:border-white/20 shadow-md text-white'
              : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs text-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-mono uppercase font-bold border px-1.5 py-0.5 rounded-md ${
              isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              Ciclo
            </span>
          </div>
          <div className="font-extrabold text-xs uppercase">{daysElapsed} Días Transcurridos</div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
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
              ? 'bg-white/10 border-white/10 text-white hover:bg-white/15'
              : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Compartir Dashboard o Abrir en Navegador</span>
        </button>
      </div>

      {/* Modal Rápido para Configurar Link de Teams */}
      {quickTeamsSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`relative w-full max-w-sm rounded-3xl p-5 border shadow-2xl transition-all ${
              isDark
                ? 'bg-[#131417] border-white/10 text-white'
                : 'bg-white border-zinc-200/80 text-zinc-900'
            }`}
          >
            <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
              isDark ? 'border-white/10' : 'border-zinc-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wide">
                    Enlace de Teams
                  </h4>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Materia: <strong className={isDark ? 'text-white' : 'text-zinc-900'}>{quickTeamsSlot.subjectName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickTeamsSlot(null)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickTeams} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-[10px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Pega tu link de Microsoft Teams:
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteQuickTeams}
                    className={`text-[10px] font-mono flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded border ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
                    }`}
                    title="Pegar del portapapeles"
                  >
                    <ClipboardPaste className="w-2.5 h-2.5" />
                    <span>Pegar</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://teams.microsoft.com/meet/..."
                  value={quickTeamsUrl}
                  onChange={(e) => setQuickTeamsUrl(e.target.value)}
                  className={`w-full text-xs rounded-xl px-3 py-2 outline-none font-mono border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
                  }`}
                  autoFocus
                />
              </div>

              {quickTeamsUrl && (
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <a
                    href={quickTeamsUrl.startsWith('http') ? quickTeamsUrl : `https://${quickTeamsUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1 text-[10px] font-bold ${
                      isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'
                    }`}
                  >
                    <span>Probar enlace de Teams</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setQuickTeamsUrl('')}
                    className="text-rose-500 hover:text-rose-600 text-[10px] cursor-pointer"
                  >
                    Quitar enlace
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickTeamsSlot(null)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer ${
                    isDark
                      ? 'text-zinc-400 hover:text-white bg-white/5'
                      : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 border ${
                    isDark
                      ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                      : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                  }`}
                >
                  {quickTeamsSaved ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{quickTeamsSaved ? '¡Guardado!' : 'Guardar Enlace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};