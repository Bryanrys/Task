import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WelcomeModalProps {
  isOpen: boolean;
  onStart: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onStart }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          {/* Animated Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-[340px] liquid-modal-dark liquid-gloss rounded-3xl p-7 text-center shadow-2xl shadow-yellow-500/10 border border-white/20"
          >
            {/* Sunglasses Emoji + Sparkles with floating animation */}
            <div className="text-4xl mb-3 flex items-center justify-center gap-1.5 relative">
              <motion.span
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: 'easeInOut',
                }}
                className="scale-125 inline-block select-none"
              >
                😎
              </motion.span>
              <motion.span
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8],
                  rotate: [0, 45, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: 'easeInOut',
                }}
                className="text-yellow-400 text-2xl inline-block select-none"
              >
                ✨
              </motion.span>
            </div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black tracking-wider text-white mb-2 uppercase"
            >
              ¡CRACK!
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-medium text-slate-300 mb-6 leading-snug"
            >
              Crea y organiza tus actividades sincronizadas!.
            </motion.p>

            {/* Main yellow button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onStart}
              className="w-full py-3 px-5 bg-[#f5cb42] hover:bg-[#fad859] active:scale-[0.98] text-black font-extrabold text-sm rounded-xl transition-colors shadow-lg shadow-yellow-500/20 cursor-pointer"
            >
              Comenzar Configuración
            </motion.button>

            {/* Small indicator pill below */}
            <div className="mt-4 flex justify-center">
              <div className="w-4 h-2 bg-[#d1a826] rounded-sm opacity-80" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
