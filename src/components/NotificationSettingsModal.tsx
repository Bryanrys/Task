import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  AlertCircle,
  CheckCircle2,
  Volume2,
  RefreshCw,
  X,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  checkNotificationPermission,
  sendSystemNotification,
  playNotificationSound,
  getRemainingMsUntilNextReminder,
  syncAndroidBackgroundSchedule,
} from '../services/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSubjects: string[];
  totalPendingCount: number;
  onTestNotification: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  pendingSubjects,
  totalPendingCount,
  onTestNotification,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('');
  const [justSynced, setJustSynced] = useState<boolean>(false);

  // Check permission on mount/open
  useEffect(() => {
    if (isOpen) {
      checkNotificationPermission().then(setPermission);
      setSettings(getNotificationSettings());
    }
  }, [isOpen]);

  // Live real-time countdown to the next scheduled notification
  useEffect(() => {
    if (!isOpen || !settings.enabled) {
      setRemainingTimeStr('');
      return;
    }

    const updateTimer = () => {
      const remainingMs = getRemainingMsUntilNextReminder();
      if (remainingMs <= 0) {
        setRemainingTimeStr('¡En cualquier momento!');
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        setRemainingTimeStr(
          `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
        );
      } else {
        setRemainingTimeStr(
          `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleToggle = () => {
    const updated = {
      ...settings,
      enabled: !settings.enabled,
      lastSent: Date.now(), // Reset cycle from now
    };
    setSettings(updated);
    saveNotificationSettings(updated);
    syncAndroidBackgroundSchedule(pendingSubjects, totalPendingCount);
  };

  const handleIntervalChange = (mins: number) => {
    const updated = {
      ...settings,
      intervalMinutes: mins,
      lastSent: Date.now(), // Start counting the new interval from right now!
    };
    setSettings(updated);
    saveNotificationSettings(updated);
    syncAndroidBackgroundSchedule(pendingSubjects, totalPendingCount);

    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2000);
  };

  const handleForceSyncAlarms = () => {
    const updated = {
      ...settings,
      lastSent: Date.now(),
    };
    setSettings(updated);
    saveNotificationSettings(updated);
    syncAndroidBackgroundSchedule(pendingSubjects, totalPendingCount);

    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2000);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    const status = await checkNotificationPermission();
    setPermission(status);

    if (granted) {
      sendSystemNotification(
        '🔔 ¡Notificaciones activadas!',
        `Te avisaremos cada ${settings.intervalMinutes} min sobre tus pendientes de la UEES.`
      );
    } else {
      playNotificationSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[390px] liquid-modal-dark rounded-3xl p-6 shadow-2xl text-stone-100 overflow-hidden liquid-gloss">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-yellow-500/15 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-white text-base tracking-wide font-mono">
                RECORDATORIOS
              </h3>
              <p className="text-[11px] text-stone-400">
                Avisos automáticos de materias UEES
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Status Pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 mb-3 text-xs backdrop-blur-md">
          <span className="text-stone-400 font-mono text-[11px] flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-yellow-500" />
            <span>Permiso del sistema:</span>
          </span>

          {permission === 'granted' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>CONCEDIDO</span>
            </span>
          ) : (
            <button
              onClick={handleRequestPermission}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold font-mono cursor-pointer transition-colors"
            >
              <AlertCircle className="w-3 h-3" />
              <span>ACTIVAR AHORA</span>
            </button>
          )}
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 mb-3 backdrop-blur-md">
          <div>
            <span className="text-xs font-bold text-white block">
              Avisos Automáticos
            </span>
            <span className="text-[10px] text-stone-400">
              {settings.enabled ? `Activo: cada ${settings.intervalMinutes} min` : 'Pausado temporalmente'}
            </span>
          </div>

          <button
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.enabled ? 'bg-yellow-400' : 'bg-stone-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-all absolute top-1 ${
                settings.enabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Live Countdown & Frequency Monitor */}
        {settings.enabled && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-amber-500/5 to-transparent border border-yellow-500/30 mb-3 text-xs backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-stone-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-400 animate-spin" />
                <span>Próximo aviso en:</span>
              </span>
              <span className="text-yellow-400 font-black tracking-wider text-xs">
                {remainingTimeStr || 'Calculando...'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-yellow-500/15">
              <span>Frecuencia: Cada {settings.intervalMinutes} min</span>
              <button
                onClick={handleForceSyncAlarms}
                title="Reiniciar contador desde ahora y programar alarma"
                className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${justSynced ? 'animate-spin' : ''}`} />
                <span>{justSynced ? '¡Reiniciado!' : 'Reiniciar ciclo'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Interval Selection with Quick Test Presets */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span>FRECUENCIA DE RECORDATORIO</span>
            </span>
            <span className="text-[9px] text-stone-500">Toca para aplicar</span>
          </label>

          <div className="grid grid-cols-3 gap-2 font-mono">
            {[
              { label: '⚡ 1 min (test)', val: 1 },
              { label: '15 min', val: 15 },
              { label: '30 min', val: 30 },
              { label: '1 hora', val: 60 },
              { label: '2 horas', val: 120 },
              { label: '4 horas', val: 240 },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => handleIntervalChange(opt.val)}
                className={`py-2 px-1 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                  settings.intervalMinutes === opt.val
                    ? 'bg-yellow-400 border-yellow-400 text-black shadow-md shadow-yellow-500/15 scale-[1.02]'
                    : 'bg-white/[0.04] border-white/10 text-stone-300 hover:border-yellow-400/50 hover:bg-white/[0.08]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Pending Status */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 text-xs font-mono backdrop-blur-md">
          <span className="text-[10px] text-stone-400 font-bold uppercase block mb-1">
            ESTADO ACTUAL DE ENTREGAS:
          </span>
          {totalPendingCount > 0 ? (
            <p className="text-stone-300 leading-relaxed text-[11px]">
              Tienes <strong className="text-yellow-400 font-extrabold">{totalPendingCount}</strong> actividades pendientes en:{' '}
              <span className="text-stone-200 font-semibold">{pendingSubjects.join(', ')}</span>.
            </p>
          ) : (
            <p className="text-emerald-400 font-bold text-[11px]">
              🎉 ¡Todas tus materias están al día en este bloque!
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={playNotificationSound}
              type="button"
              className="py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <Volume2 className="w-4 h-4 text-yellow-400" />
              <span>Oír Timbre 🔔</span>
            </button>

            <button
              onClick={onTestNotification}
              type="button"
              className="py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <BellRing className="w-4 h-4" />
              <span>Enviar Alerta</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
