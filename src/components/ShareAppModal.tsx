import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, Share2, Globe, ExternalLink, MessageCircle, Edit3, Sparkles, CheckCircle2, Smartphone } from 'lucide-react';
import { triggerHaptic } from '../services/hapticsService';

export const PRESET_HOSTING_OPTIONS = [
  {
    name: 'Vercel',
    url: 'https://task-ecru-eight-84.vercel.app',
    tag: 'Recomendado',
  },
  {
    name: 'Netlify',
    url: 'https://dashboard-academico-uees.netlify.app',
    tag: 'Rápido',
  },
  {
    name: 'Render',
    url: 'https://dashboard-academico-uees.onrender.com',
    tag: 'Web',
  },
];

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  appUrl: string;
  onUpdateAppUrl?: (newUrl: string) => void;
  onShowToast: (msg: string) => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  appUrl,
  onUpdateAppUrl,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState(appUrl);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(appUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = appUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopied(true);
      onShowToast('🔗 ¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('⚠️ No se pudo copiar automáticamente');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dashboard Académico UEES',
          text: '¡Ey! Te comparto el link del Dashboard Académico para organizar materias, notas y tareas:',
          url: appUrl,
        });
        return;
      } catch {}
    }
    handleCopy();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `¡Hola! Te comparto el link del Dashboard Académico UEES para llevar materias, notas y tareas:\n${appUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleOpenBrowser = () => {
    window.open(appUrl, '_blank');
  };

  const handleStartEdit = () => {
    setTempUrl(appUrl);
    setIsEditing(true);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempUrl.trim()) return;

    let formatted = tempUrl.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
    }

    if (onUpdateAppUrl) {
      onUpdateAppUrl(formatted);
    }
    setIsEditing(false);
    onShowToast('✅ ¡Enlace actualizado correctamente!');
  };

  const handleSelectPreset = (presetUrl: string) => {
    setTempUrl(presetUrl);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) {
            triggerHaptic('light');
            onClose();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#131417] border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Barra superior de arrastre */}
        <div className="w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-white/20 mx-auto -mt-2 mb-3 cursor-grab active:cursor-grabbing select-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-2xl border ${
            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
          }`}>
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider font-mono">
              ENLACE DE LA APP WEB
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Para abrir en tu PC o compartir con amigos
            </p>
          </div>
        </div>

        {/* Edit Form or URL Display */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className={`space-y-3 mb-3 p-3.5 rounded-2xl border ${
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center gap-1.5 font-mono ${
                isDark ? 'text-zinc-300' : 'text-zinc-700'
              }`}>
                <Edit3 className="w-3.5 h-3.5" />
                Personalizar Enlace Compartido
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`text-[10px] cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                Cancelar
              </button>
            </div>

            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Escribe o pega la dirección web:
              </label>
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://tu-dashboard.vercel.app"
                className={`w-full text-xs font-mono rounded-xl px-3 py-2 outline-none border ${
                  isDark
                    ? 'bg-black/30 border-white/10 focus:border-white text-white'
                    : 'bg-white border-zinc-200 focus:border-zinc-900 text-zinc-900'
                }`}
                autoFocus
              />
            </div>

            {/* Presets suggestions */}
            <div>
              <span className={`text-[10px] block mb-1.5 flex items-center gap-1 ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                <Sparkles className="w-3 h-3 text-zinc-400" />
                O selecciona uno predeterminado:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_HOSTING_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleSelectPreset(opt.url)}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold text-center transition-all cursor-pointer truncate ${
                      tempUrl === opt.url
                        ? isDark
                          ? 'bg-white !text-black text-black border-white'
                          : 'bg-black !text-white text-white border-black'
                        : isDark
                        ? 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`flex-1 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                  isDark
                    ? 'border-white/10 text-zinc-400 hover:text-white'
                    : 'border-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex-1 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                  isDark
                    ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                    : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                }`}
              >
                Guardar Enlace
              </button>
            </div>
          </form>
        ) : (
          <div
            className={`p-3.5 rounded-2xl border mb-3 space-y-2 ${
              isDark
                ? 'bg-white/[0.03] border-white/10'
                : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <Globe className={`w-4 h-4 shrink-0 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
                <span className={`text-xs font-mono truncate select-all ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  {appUrl}
                </span>
              </div>

              <button
                onClick={handleCopy}
                title="Copiar enlace"
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : isDark
                    ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                    : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Listo' : 'Copiar'}</span>
              </button>
            </div>

            {/* Quick Edit link bar */}
            <div className={`flex items-center justify-between pt-1 border-t text-[11px] ${
              isDark ? 'border-white/5' : 'border-zinc-200'
            }`}>
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Enlace verificado
              </span>
              <button
                onClick={handleStartEdit}
                className={`text-[10px] flex items-center gap-1 transition-colors cursor-pointer font-bold ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Cambiar enlace</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Download APK Direct */}
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/app-debug.apk';
              link.download = 'app-debug.apk';
              link.click();
            }}
            className={`w-full py-2.5 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
              isDark
                ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
            }`}
          >
            <Smartphone className={`w-4 h-4 ${isDark ? '!text-black text-black' : '!text-white text-white'}`} />
            <span>Descargar APK Directo (Actualizado)</span>
          </button>

          {/* Ficha Técnica APK Estilo Cápsula (Captura) */}
          <div className={`w-full rounded-2xl border overflow-hidden ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className={`grid grid-cols-3 text-center divide-x ${
              isDark ? 'divide-white/10 text-white' : 'divide-zinc-200 text-zinc-900'
            }`}>
              <div className="p-2 sm:p-2.5">
                <span className={`block text-[10px] uppercase font-mono tracking-wider ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Versión</span>
                <span className="block text-xs sm:text-sm font-bold font-mono mt-0.5">2.1</span>
              </div>
              <div className={`p-2 sm:p-2.5 ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                <span className={`block text-[10px] uppercase font-mono tracking-wider ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Tamaño</span>
                <span className="block text-xs sm:text-sm font-bold font-mono mt-0.5">8.8 MB</span>
              </div>
              <div className="p-2 sm:p-2.5">
                <span className={`block text-[10px] uppercase font-mono tracking-wider ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Requisitos</span>
                <span className="block text-xs sm:text-sm font-bold font-mono mt-0.5">Android 7.0+</span>
              </div>
            </div>
            <div className={`px-2.5 py-1.5 border-t text-center flex items-center justify-center gap-1.5 text-[10px] font-mono ${
              isDark ? 'border-white/10 bg-black/20 text-zinc-400' : 'border-zinc-200 bg-white/50 text-zinc-600'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Compilación Oficial Actualizada (GMT-6)</span>
            </div>
          </div>

          {/* Download APK from GitHub */}
          <div className="flex flex-col gap-1 w-full">
            <button
              onClick={() => window.open('https://github.com/Bryanrys/Task/raw/main/apk/app-debug.apk', '_blank')}
              className={`w-full py-2.5 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                isDark
                  ? 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-zinc-400" />
              <span>Descargar APK desde GitHub</span>
            </button>
          </div>

          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </button>

          {/* Native Share / General */}
          <button
            onClick={handleNativeShare}
            className={`w-full py-2 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98 ${
              isDark
                ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300'
                : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Compartir enlace...</span>
          </button>

          {/* Open in Browser */}
          <button
            onClick={handleOpenBrowser}
            className={`w-full py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                : 'border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en el Navegador</span>
          </button>
        </div>

        {/* Footer info note */}
        <p className={`text-[10px] text-center mt-3 font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Tip: Puedes modificar el enlace arriba en cualquier momento pulsando &quot;Cambiar enlace&quot;.
        </p>
      </motion.div>
    </div>
  );
};
