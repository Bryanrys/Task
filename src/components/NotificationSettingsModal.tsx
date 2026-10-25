import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Clock,
  AlertCircle,
  CheckCircle2,
  Volume2,
  RefreshCw,
  X,
  Smartphone,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-[390px] bg-[#131417] border border-white/10 rounded-3xl p-6 shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide flex items-center gap-1.5 font-mono">
                RECORDATORIOS
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Alarmas periódicas de tareas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission status card */}
        {permission !== 'granted' && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-4 flex items-start gap-2.5 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1">
              <span className="font-bold block">Permisos requeridos</span>
              <span className="text-[11px] text-amber-200/80 leading-tight block mb-2">
                Permite notificaciones para que suenen en segundo plano y pantalla bloqueada.
              </span>
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Habilitar permisos ahora
              </button>
            </div>
          </div>
        )}

        {/* Toggle master */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 font-mono">
          <div>
            <span className="font-bold text-xs block text-white">Recordatorios automáticos</span>
            <span className="text-[10px] text-zinc-400">
              {settings.enabled ? 'Activos en segundo plano' : 'Pausados'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.enabled ? 'bg-white' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                settings.enabled
                  ? 'right-0.5 bg-zinc-950 shadow-md'
                  : 'left-0.5 bg-zinc-400'
              }`}
            />
          </button>
        </div>

        {/* Live Countdown & Alarm Manager Status */}
        {settings.enabled && (
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 mb-4 font-mono space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-300" />
                <span>Próximo aviso en:</span>
              </span>
              <span className="text-white font-black tracking-wider text-xs">
                {remainingTimeStr || 'Calculando...'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/10">
              <span>Frecuencia: Cada {settings.intervalMinutes} min</span>
              <button
                onClick={handleForceSyncAlarms}
                title="Reiniciar contador desde ahora y programar alarma"
                className="text-white hover:text-zinc-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${justSynced ? 'animate-spin' : ''}`} />
                <span>{justSynced ? '¡Reiniciado!' : 'Reiniciar ciclo'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Interval Selection with Quick Test Presets */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>FRECUENCIA DE RECORDATORIO</span>
            </span>
            <span className="text-[9px] text-zinc-500">Toca para aplicar</span>
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
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  settings.intervalMinutes === opt.val
                    ? 'bg-white !text-black text-black border-white font-black shadow-sm'
                    : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Pending Status */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 mb-4 text-xs font-mono">
          <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">
            ESTADO ACTUAL DE ENTREGAS:
          </span>
          {totalPendingCount > 0 ? (
            <p className="text-zinc-300 leading-relaxed text-[11px]">
              Tienes <strong className="text-white font-extrabold">{totalPendingCount}</strong> actividades pendientes en:{' '}
              <span className="text-zinc-200 font-semibold">{pendingSubjects.join(', ')}</span>.
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
              className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <span>Oír Timbre 🔔</span>
            </button>

            <button
              onClick={onTestNotification}
              type="button"
              className="py-2.5 px-3 bg-white !text-black text-black hover:bg-zinc-200 border border-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <BellRing className="w-4 h-4" />
              <span>Enviar Alerta</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
