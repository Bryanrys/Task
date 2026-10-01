import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SegmentedLoaderProps {
  isOpen: boolean;
  onEnter: () => void;
}

export const SegmentedLoader: React.FC<SegmentedLoaderProps> = ({ isOpen, onEnter }) => {
  const [filledCount, setFilledCount] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Inicializando datos :)...');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setFilledCount(0);
    setIsReady(false);
    setStatusText('Inicializando datos :)...');

    const totalSegments = 8;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      setFilledCount(current);

      if (current === 4) {
        setStatusText('Cargando materias y semanas...');
      }

      if (current >= totalSegments) {
        clearInterval(interval);
        setTimeout(() => {
          setStatusText('✨️ ¡Listo para ingresar! (Toca aquí)');
          setIsReady(true);
        }, 200);
      }
    }, 110);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0a09] flex items-center justify-center p-5 text-center select-none animate-fadeIn">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="max-w-[420px] w-full flex flex-col items-center gap-4"
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">
          BIENVENIDO
        </h2>

        <button
          onClick={() => {
            if (isReady) onEnter();
          }}
          disabled={!isReady}
          className={`w-full max-w-[320px] p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
            isReady
              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-300 shadow-xl shadow-yellow-500/20 active:scale-95'
              : 'bg-[#141210] border-[#292524] text-stone-400 cursor-wait'
          }`}
        >
          <span className="font-bold text-sm tracking-wide">
            {statusText}
          </span>

          {/* 8-Segment Loading Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-1 p-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full rounded-sm transition-colors duration-150 ${
                  i < filledCount ? 'bg-yellow-400 shadow-xs shadow-yellow-400' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        </button>

        {isReady && (
          <p className="text-xs text-stone-400 animate-pulse">
            Toca el botón amarillo para entrar a tu Dashboard
          </p>
        )}
      </motion.div>
    </div>
  );
};
