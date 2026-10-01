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
            className="w-full max-w-[360px] bg-[#141217] border border-pink-500/60 rounded-3xl p-7 text-center shadow-2xl shadow-pink-500/10"
          >
            <div className="text-4xl mb-3 select-none animate-bounce">😎✨</div>
            <h2 className="text-xl font-extrabold text-white mb-1.5 uppercase tracking-wide">
              ¡Semana {weekNumber} de Parciales!
            </h2>
            <p className="text-xs text-pink-400 font-bold mb-3 tracking-widest uppercase">
              FASE DE EXÁMENES
            </p>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed italic">
              "{frase}"
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 px-5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-pink-500/20 cursor-pointer"
            >
              Iniciar Fase de Exámenes 🎯
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
