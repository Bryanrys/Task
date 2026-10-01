import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, BookOpen, Volume2 } from 'lucide-react';
import { playNotificationSound } from '../services/notifications';

interface PomodoroTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const PomodoroTimerModal: React.FC<PomodoroTimerModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 min in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = mode === 'study' ? 25 * 60 : 5 * 60;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playNotificationSound();
            if (mode === 'study') {
              setMode('break');
              return 5 * 60;
            } else {
              setMode('study');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  if (!isOpen) return null;

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const handleSwitchMode = (newMode: 'study' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'study' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-xs rounded-3xl p-6 border shadow-2xl text-center transition-colors ${
          isDark
            ? 'bg-[#141210] border-[#292524] text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-wider font-mono text-yellow-500 flex items-center gap-1.5">
            <span>🍅 POMODORO DE ESTUDIO</span>
          </span>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div
          className={`flex rounded-xl p-1 mb-6 border transition-colors ${
            isDark ? 'bg-[#1c1917] border-[#2c2825]' : 'bg-stone-100 border-stone-200'
          }`}
        >
          <button
            onClick={() => handleSwitchMode('study')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'study'
                ? 'bg-yellow-400 text-black shadow-xs'
                : isDark
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Enfoque (25m)</span>
          </button>

          <button
            onClick={() => handleSwitchMode('break')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'break'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Descanso (5m)</span>
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          <div
            className={`text-5xl font-black tracking-tight font-mono mb-2 ${
              mode === 'study' ? 'text-yellow-400' : 'text-emerald-400'
            }`}
          >
            {formattedTime}
          </div>

          <p className="text-xs text-stone-400 mb-4 font-mono">
            {mode === 'study'
              ? isRunning
                ? '🔥 Concentrado en tus tareas y foros...'
                : 'Listo para empezar a estudiar'
              : '☕ Respira, toma agua y descansa la vista'}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-stone-800/40 rounded-full h-1.5 overflow-hidden mb-6">
            <div
              className={`h-full transition-all duration-500 ${
                mode === 'study' ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            className={`flex-1 py-3 px-4 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md ${
              mode === 'study'
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-500/10'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/10'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Iniciar Enfoque</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            title="Reiniciar temporizador"
            className={`py-3 px-3.5 border rounded-xl transition-all cursor-pointer ${
              isDark
                ? 'border-[#292524] bg-[#1a1715] hover:bg-[#25211e] text-stone-400 hover:text-white'
                : 'border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
