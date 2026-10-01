import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, ExternalLink, MessageCircle, Edit3, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

export const PRESET_HOSTING_OPTIONS = [
  {
    name: 'Vercel',
    url: 'https://dashboard-academico-uees.vercel.app',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-5 border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#141210] border-[#292524] text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
            isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-yellow-400/10 text-yellow-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider font-mono">
              ENLACE DE LA APP WEB
            </h3>
            <p className="text-[11px] text-stone-400">
              Para abrir en tu PC o compartir con amigos
            </p>
          </div>
        </div>

        {/* Edit Form or URL Display */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3 mb-3 p-3.5 rounded-2xl border bg-stone-900/60 border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5 font-mono">
                <Edit3 className="w-3.5 h-3.5" />
                Personalizar Enlace Compartido
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[10px] text-stone-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div>
              <label className="text-[10px] text-stone-400 block mb-1">
                Escribe o pega la dirección web (sin Google):
              </label>
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://tu-dashboard.vercel.app"
                className="w-full text-xs font-mono bg-stone-950 border border-stone-700 focus:border-yellow-400 rounded-xl px-3 py-2 text-white outline-none"
                autoFocus
              />
            </div>

            {/* Presets suggestions */}
            <div>
              <span className="text-[10px] text-stone-400 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                O selecciona uno generado automáticamente:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_HOSTING_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleSelectPreset(opt.url)}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold text-center transition-all cursor-pointer truncate ${
                      tempUrl === opt.url
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300'
                        : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
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
                className="flex-1 py-1.5 rounded-xl border border-stone-700 text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black cursor-pointer transition-colors"
              >
                Guardar Enlace
              </button>
            </div>
          </form>
        ) : (
          <div
            className={`p-3 rounded-2xl border mb-3 space-y-2 ${
              isDark
                ? 'bg-[#1b1917] border-[#292524]'
                : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <Globe className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-xs font-mono truncate select-all text-stone-200">
                  {appUrl}
                </span>
              </div>

              <button
                onClick={handleCopy}
                title="Copiar enlace"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  copied
                    ? 'bg-emerald-500 border-emerald-400 text-black'
                    : 'bg-yellow-400 hover:bg-yellow-300 border-yellow-400 text-black'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Listo' : 'Copiar'}</span>
              </button>
            </div>

            {/* Quick Edit link bar */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-800/60 text-[11px]">
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Enlace sin Google (sin 404)
              </span>
              <button
                onClick={handleStartEdit}
                className="text-[10px] text-stone-400 hover:text-yellow-400 flex items-center gap-1 transition-colors cursor-pointer font-bold"
              >
                <Edit3 className="w-3 h-3" />
                <span>Cambiar enlace</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
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
                ? 'border-stone-700 bg-stone-800/80 hover:bg-stone-800 text-stone-200'
                : 'border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-yellow-400" />
            <span>Compartir enlace...</span>
          </button>

          {/* Open in Browser */}
          <button
            onClick={handleOpenBrowser}
            className={`w-full py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
                : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en el Navegador</span>
          </button>
        </div>

        {/* Footer info note */}
        <p className="text-[10px] text-center text-stone-500 mt-3 font-mono">
          Tip: Puedes modificar el enlace arriba en cualquier momento pulsando &quot;Cambiar enlace&quot;.
        </p>
      </div>
    </div>
  );
};

