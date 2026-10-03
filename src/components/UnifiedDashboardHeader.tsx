import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Upload,
  Download,
  FileDown,
  FileUp,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit2,
  Check,
} from 'lucide-react';

interface UnifiedDashboardHeaderProps {
  isDark: boolean;
  startDate: string;
  daysElapsed: number;
  cloudStatus: string;
  lastUpdated: string;
  accessCode: string;
  quickNote?: string;
  isSyncing: boolean;
  onOpenStartDate: () => void;
  onOpenEditNote: () => void;
  onResetWeekTasks: () => void;
  onUploadCloud: () => void;
  onDownloadCloud: () => void;
  onExportJSON: () => void;
  onImportJSONClick: () => void;
  onCopyCode: () => void;
}

export const UnifiedDashboardHeader: React.FC<UnifiedDashboardHeaderProps> = ({
  isDark,
  startDate,
  daysElapsed,
  cloudStatus,
  lastUpdated,
  accessCode,
  quickNote,
  isSyncing,
  onOpenStartDate,
  onOpenEditNote,
  onResetWeekTasks,
  onUploadCloud,
  onDownloadCloud,
  onExportJSON,
  onImportJSONClick,
  onCopyCode,
}) => {
  const [showJsonOptions, setShowJsonOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-3xl p-3.5 sm:p-4 mb-3 border transition-all liquid-gloss ${
        isDark
          ? 'liquid-glass-dark text-stone-100 border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.08)]'
          : 'liquid-glass-light text-stone-800 border-blue-200/80 shadow-md'
      }`}
    >
      {/* Top Row: Dates, Elapsed Days & Live Cloud Status */}
      <div className="flex items-center justify-between gap-2 mb-2.5 text-[11px] font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onOpenStartDate}
            title="Haz clic para cambiar la fecha de inicio"
            className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer shrink-0 ${
              isDark ? 'text-stone-300 hover:text-yellow-400' : 'text-stone-600 hover:text-amber-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span className="uppercase">INICIO: {startDate}</span>
            <span className="text-[9px] text-yellow-500 underline decoration-dashed">
              (editar)
            </span>
          </button>

          <span className="text-stone-500">•</span>

          <span
            onClick={onOpenStartDate}
            className={`font-black tracking-wider cursor-pointer shrink-0 ${
              isDark ? 'text-stone-200 hover:text-emerald-400' : 'text-stone-700 hover:text-emerald-600'
            }`}
            title="Días transcurridos calculados automáticamente"
          >
            {daysElapsed} DÍAS
          </span>
        </div>

        {/* Live Cloud Status Badge */}
        <div
          className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1.5 ${
            isDark
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}
          title={`Última actualización: ${lastUpdated}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{cloudStatus}</span>
        </div>
      </div>

      {/* Action Row: Sleek Side-by-Side Database Sync Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {/* Subir a la Nube */}
        <button
          onClick={onUploadCloud}
          disabled={isSyncing}
          className={`py-2 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-cyan-600/25 border-blue-400/40 text-blue-200 hover:border-blue-400/70 hover:from-blue-600/35 hover:to-cyan-600/35 shadow-[0_0_12px_rgba(59,130,246,0.18)]'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-900 hover:bg-blue-100 shadow-xs'
          }`}
          title="Guardar materias y tareas en Supabase"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-extrabold tracking-wide text-xs">Subir Nube</span>
        </button>

        {/* Descargar Nube */}
        <button
          onClick={onDownloadCloud}
          disabled={isSyncing}
          className={`py-2 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-emerald-600/25 via-teal-600/25 to-cyan-600/25 border-emerald-400/40 text-emerald-200 hover:border-emerald-400/70 hover:from-emerald-600/35 hover:to-cyan-600/35 shadow-[0_0_12px_rgba(16,185,129,0.18)]'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-xs'
          }`}
          title="Cargar materias y tareas desde Supabase con clave oo"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-extrabold tracking-wide text-xs">Descargar Nube</span>
        </button>
      </div>

      {/* Bottom Utility Row: Note & Tools */}
      <div
        className={`pt-2 border-t flex items-center justify-between gap-2 ${
          isDark ? 'border-white/10' : 'border-stone-200'
        }`}
      >
        {/* Quick Note */}
        <button
          onClick={onOpenEditNote}
          className={`flex items-center gap-1.5 text-[11px] italic truncate max-w-[170px] sm:max-w-[260px] text-left transition-colors cursor-pointer ${
            isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Toca para editar la nota del dashboard"
        >
          <Edit2 className="w-3 h-3 text-stone-500 shrink-0" />
          <span className="truncate">{quickNote || 'Agregar nota rápida...'}</span>
        </button>

        {/* Action Controls Cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy Access Code */}
          <button
            onClick={handleCopy}
            title="Copiar clave de acceso (oo)"
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-stone-300 hover:border-yellow-400/50 hover:text-yellow-300'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-amber-400 hover:text-amber-800'
            }`}
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <LinkIcon className="w-3 h-3 text-yellow-400" />
            )}
            <span>{accessCode}</span>
          </button>

          {/* JSON Backup Toggle */}
          <button
            onClick={() => setShowJsonOptions(!showJsonOptions)}
            title="Opciones de respaldo local JSON"
            className={`flex items-center gap-0.5 px-2 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-stone-400 hover:text-stone-200'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>JSON</span>
            {showJsonOptions ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Reset Week Tasks */}
          <button
            onClick={onResetWeekTasks}
            title="Reiniciar casillas de esta semana"
            className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-stone-400 hover:text-rose-400 hover:border-rose-400/40'
                : 'bg-stone-50 border-stone-200 text-stone-500 hover:text-rose-600 hover:border-rose-300'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Collapsible Local JSON Backup & Restore Options */}
      <AnimatePresence>
        {showJsonOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-2 pt-2 border-t grid grid-cols-2 gap-2 ${
                isDark ? 'border-white/10' : 'border-stone-200'
              }`}
            >
              <button
                onClick={onExportJSON}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono">Descargar .JSON</span>
              </button>

              <button
                onClick={onImportJSONClick}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <FileUp className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono">Cargar .JSON</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
