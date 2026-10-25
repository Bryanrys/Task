import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Coffee, BookOpen } from 'lucide-react';

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
  const STUDY_TIME = 25 * 60; // 25 mins in seconds
  const BREAK_TIME = 5 * 60;  // 5 mins in seconds

  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState<number>(STUDY_TIME);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'study') {
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        setMode('study');
        setTimeLeft(STUDY_TIME);
      }
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  if (!isOpen) return null;

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? STUDY_TIME : BREAK_TIME);
  };

  const handleSwitchMode = (newMode: 'study' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'study' ? STUDY_TIME : BREAK_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = mode === 'study' ? STUDY_TIME : BREAK_TIME;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = totalTime > 0 ? Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div
        className={`relative w-full max-w-xs rounded-3xl p-6 border shadow-2xl text-center transition-colors ${
          isDark
            ? 'bg-[#131417] border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span>🍅 POMODORO DE ESTUDIO</span>
          </span>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div
          className={`flex rounded-xl p-1 mb-6 border transition-colors ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-zinc-100 border-zinc-200'
          }`}
        >
          <button
            onClick={() => handleSwitchMode('study')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'study'
                ? isDark
                  ? 'bg-white !text-black text-black font-black shadow-xs'
                  : 'bg-black !text-white text-white font-black shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Enfoque (25m)</span>
          </button>

          <button
            onClick={() => handleSwitchMode('break')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'break'
                ? 'bg-emerald-500 text-white shadow-xs font-black'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Descanso (5m)</span>
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          <div className="text-5xl font-black tracking-tight font-mono mb-2">
            {formattedTime}
          </div>

          <p className={`text-xs mb-4 font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {mode === 'study'
              ? isRunning
                ? '🔥 Concentrado en tus tareas y foros...'
                : 'Listo para empezar a estudiar'
              : '☕ Respira, toma agua y descansa la vista'}
          </p>

          {/* Progress bar */}
          <div className={`w-full rounded-full h-1.5 overflow-hidden mb-6 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}>
            <div
              className={`h-full transition-all duration-500 ${
                mode === 'study' ? (isDark ? 'bg-white' : 'bg-zinc-900') : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            className={`flex-1 py-3 px-4 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md border ${
              mode === 'study'
                ? isDark
                  ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                  : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
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
            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
            }`}
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
