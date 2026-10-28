import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, Smartphone, Sparkles, BookOpen, Clock } from 'lucide-react';
import { triggerHaptic } from '../services/hapticsService';
import { syncTaskWidget, getSavedTaskWidgetData } from '../services/pensumWidgetService';

interface PensumConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  activeSubjectsCount: number;
  onShowToast: (msg: string) => void;
}

export const PensumConfigModal: React.FC<PensumConfigModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  onShowToast,
}) => {
  const [data, setData] = useState(getSavedTaskWidgetData());
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const current = getSavedTaskWidgetData();
      setData(current);
      await syncTaskWidget(current);
      triggerHaptic('success');
      onShowToast('🎉 ¡Widget de tareas sincronizado con éxito!');
    } catch {
      triggerHaptic('error');
      onShowToast('⚠️ Error al sincronizar el widget');
    } finally {
      setIsSyncing(false);
    }
  };

  const materiasCiclo = [
    { nombre: 'PROGRA II', tareas: '3/3 entregadas', alDia: true },
    { nombre: 'MATE II', tareas: '2/2 entregadas', alDia: true },
    { nombre: 'FISICA II', tareas: '2/2 entregadas', alDia: true },
    { nombre: 'REDAC Y COMU', tareas: '2/2 entregadas', alDia: true },
    { nombre: 'BASES DE DATOS', tareas: '1 pendiente', alDia: false },
  ];

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
        className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
          isDark
            ? 'bg-[#121318] border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Barra superior de arrastre */}
        <div className="w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-white/20 mx-auto -mt-2 mb-3 cursor-grab active:cursor-grabbing select-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-2.5 rounded-2xl border ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider font-mono">
              WIDGET DE TAREAS (ANDROID)
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Monitorea tus tareas que te hacen falta en la pantalla de tu celular
            </p>
          </div>
        </div>

        {/* Vista previa en vivo del Widget */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 relative overflow-hidden ${
            isDark ? 'bg-black/40 border-white/10' : 'bg-zinc-100/80 border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> VISTA PREVIA EN TU ESCRITORIO
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {data.porcentaje}% entregado
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-2xl font-black font-mono text-emerald-400">{data.pendientes}</span>
            <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {data.pendientes === 1
                ? 'tarea pendiente por entregar'
                : data.pendientes === 0
                ? '¡Todo al día! Sin pendientes'
                : 'tareas pendientes por entregar'}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-2 rounded-full bg-zinc-700/30 overflow-hidden mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, data.porcentaje))}%` }}
            />
          </div>

          {/* Cápsulas de resumen */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono mb-2.5">
            <div className={`p-1.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200'}`}>
              <span className="text-zinc-400 block text-[9px]">PENDIENTES</span>
              <span className="font-bold text-blue-400 text-xs">{data.pendientes}</span>
            </div>
            <div className={`p-1.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200'}`}>
              <span className="text-zinc-400 block text-[9px]">ENTREGADAS</span>
              <span className="font-bold text-emerald-400 text-xs">{data.completadas}</span>
            </div>
            <div className={`p-1.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200'}`}>
              <span className="text-zinc-400 block text-[9px]">MATERIAS</span>
              <span className="font-bold text-zinc-100 dark:text-zinc-200 text-xs">{data.materias}</span>
            </div>
          </div>

          {/* Tarjeta de pendiente actual */}
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 mb-0.5">
              <Clock className="w-2.5 h-2.5" /> PENDIENTE ACTUAL:
            </span>
            <span className="text-xs font-bold text-zinc-200 block truncate">
              {data.proximaTarea}
            </span>
          </div>
        </div>

        {/* Lista de tus 5 materias inscritas */}
        <div className="mb-4 space-y-1.5">
          <span className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-zinc-300' : 'text-zinc-700'
          }`}>
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            Tus 5 Materias en Curso:
          </span>

          <div className="space-y-1">
            {materiasCiclo.map((m) => (
              <div
                key={m.nombre}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className="font-bold font-mono">{m.nombre}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                    m.alDia
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  {m.tareas}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Botón de sincronización manual */}
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-md active:scale-98 mb-3.5 ${
            isDark
              ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
              : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${isDark ? '!text-black text-black' : '!text-white text-white'}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Widget con Android Ahora'}</span>
        </button>

        {/* Nota informativa */}
        <div
          className={`p-3 rounded-2xl border text-xs ${
            isDark ? 'bg-white/[0.02] border-white/5 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] text-emerald-400 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SINCRONIZACIÓN AUTOMÁTICA EN ANDROID</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Cada vez que marcas o desmarcas una tarea en la app, el widget de la pantalla de inicio de tu celular se actualiza automáticamente.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
