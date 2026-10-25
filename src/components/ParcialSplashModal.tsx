import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ParcialSplashModalProps {
  isOpen: boolean;
  weekNumber: number;
  onClose: () => void;
}

const FRASES_MOTIVACIONALES = [
  'Demuestra todo lo que aprendiste en estas semanas. ¡Enfócate y a romperla!',
  'Confía en tu preparación y mantén la calma. ¡Este examen es tuyo!',
  'El esfuerzo de semanas enteras da sus frutos hoy. ¡Con todo el poder!',
  'La disciplina supera cualquier reto. ¡A dar el 100% en cada prueba!',
  'SOLO SÉ TÚ. ¡A romperla crack! 🔥',
];

export const ParcialSplashModal: React.FC<ParcialSplashModalProps> = ({
  isOpen,
  weekNumber,
  onClose,
}) => {
  const frase = React.useMemo(() => {
    return FRASES_MOTIVACIONALES[Math.floor(Math.random() * FRASES_MOTIVACIONALES.length)];
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-[360px] bg-[#131417] border border-white/15 rounded-3xl p-7 text-center shadow-2xl text-white"
          >
            <div className="text-4xl mb-3 select-none animate-bounce">😎✨</div>
            <h2 className="text-xl font-black text-white mb-1.5 uppercase tracking-wide">
              ¡Semana {weekNumber} de Parciales!
            </h2>
            <p className="text-xs text-zinc-400 font-bold mb-3 tracking-widest uppercase font-mono">
              FASE DE EXÁMENES OFICIALES
            </p>
            <p className="text-xs text-zinc-300 mb-6 leading-relaxed italic">
              "{frase}"
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 px-5 bg-white !text-black text-black hover:bg-zinc-200 active:scale-95 font-black text-xs rounded-xl transition-all shadow-lg border border-white cursor-pointer font-mono"
            >
              Iniciar Fase de Exámenes 🎯
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
