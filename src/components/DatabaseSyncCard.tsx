import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Upload,
  Download,
  FileDown,
  FileUp,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Cloud,
  Check,
} from 'lucide-react';

interface DatabaseSyncCardProps {
  isDark: boolean;
  cloudStatus: string;
  lastUpdated: string;
  accessCode: string;
  isSyncing: boolean;
  onUploadCloud: () => void;
  onDownloadCloud: () => void;
  onExportJSON: () => void;
  onImportJSONClick: () => void;
  onCopyCode: () => void;
}

export const DatabaseSyncCard: React.FC<DatabaseSyncCardProps> = ({
  isDark,
  cloudStatus,
  lastUpdated,
  accessCode,
  isSyncing,
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      className={`rounded-3xl p-4 sm:p-5 mb-4 border transition-all liquid-gloss ${
        isDark
          ? 'liquid-glass-dark text-stone-100 border-blue-500/25 shadow-[0_0_25px_rgba(59,130,246,0.1)]'
          : 'liquid-glass-light text-stone-800 border-blue-200 shadow-md'
      }`}
    >
      {/* Header: Title, Icon & Sync Status */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2.5 rounded-2xl border shrink-0 transition-transform ${
              isDark
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3
                className={`font-black text-xs sm:text-sm uppercase tracking-wider ${
                  isDark ? 'text-blue-300' : 'text-blue-900'
                }`}
              >
                Base de Datos & Nube
              </h3>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                Supabase
              </span>
            </div>
            <p
              className={`text-[10px] sm:text-[11px] truncate ${
                isDark ? 'text-stone-400' : 'text-stone-600'
              }`}
            >
              Sincroniza y respalda tus materias y tareas
            </p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div
          className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1.5 ${
            isDark
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}
          title={`Última actualización: ${lastUpdated}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden xs:inline">{cloudStatus}</span>
          <span className="xs:hidden">Nube OK</span>
        </div>
      </div>

      {/* Main Action Buttons Grid: Subir y Descargar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
        {/* Botón Subir / Guardar Base de Datos */}
        <button
          onClick={onUploadCloud}
          disabled={isSyncing}
          className={`group p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-cyan-600/20 border-blue-400/40 text-blue-200 hover:border-blue-400/70 hover:from-blue-600/30 hover:to-cyan-600/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-900 hover:bg-blue-100/80 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-transform group-hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                  : 'bg-blue-200/80 text-blue-800'
              }`}
            >
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs sm:text-[13px] tracking-wide">
                Subir a la Nube
              </div>
              <div
                className={`text-[10px] font-normal ${
                  isDark ? 'text-blue-300/70' : 'text-blue-700/80'
                }`}
              >
                Guardar base de datos
              </div>
            </div>
          </div>
          <span className="text-sm">☁️⬆️</span>
        </button>

        {/* Botón Descargar Base de Datos */}
        <button
          onClick={onDownloadCloud}
          disabled={isSyncing}
          className={`group p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 border-emerald-400/40 text-emerald-200 hover:border-emerald-400/70 hover:from-emerald-600/30 hover:to-cyan-600/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100/80 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-transform group-hover:translate-y-0.5 ${
                isDark
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                  : 'bg-emerald-200/80 text-emerald-800'
              }`}
            >
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs sm:text-[13px] tracking-wide">
                Descargar Nube
              </div>
              <div
                className={`text-[10px] font-normal ${
                  isDark ? 'text-emerald-300/70' : 'text-emerald-700/80'
                }`}
              >
                Cargar base de datos
              </div>
            </div>
          </div>
          <span className="text-sm">☁️⬇️</span>
        </button>
      </div>

      {/* Auxiliary Footer: Code & JSON Backup Toggle */}
      <div
        className={`pt-2.5 border-t flex items-center justify-between gap-2 ${
          isDark ? 'border-white/10' : 'border-stone-200'
        }`}
      >
        {/* Copy Access Code */}
        <button
          onClick={handleCopy}
          title="Copiar código de acceso a la nube"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-white/[0.04] border-white/10 text-stone-300 hover:border-yellow-400/50 hover:text-yellow-300'
              : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-amber-400 hover:text-amber-800'
          }`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <LinkIcon className="w-3.5 h-3.5 text-yellow-400" />
          )}
          <span>Código: {accessCode}</span>
        </button>

        {/* Toggle JSON Backup Options */}
        <button
          onClick={() => setShowJsonOptions(!showJsonOptions)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-white/[0.04] border-white/10 text-stone-400 hover:text-stone-200 hover:bg-white/[0.08]'
              : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <span>Respaldo JSON</span>
          {showJsonOptions ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
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
              className={`mt-2.5 pt-2.5 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 ${
                isDark ? 'border-white/10' : 'border-stone-200'
              }`}
            >
              <button
                onClick={onExportJSON}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">Descargar archivo .JSON</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">💾 Guardar</span>
              </button>

              <button
                onClick={onImportJSONClick}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileUp className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Cargar archivo .JSON</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">📂 Restaurar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
