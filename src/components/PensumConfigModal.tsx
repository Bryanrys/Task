import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, GraduationCap, CheckCircle2, Smartphone, Save, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../services/hapticsService';
import { getPensumData, savePensumData, PensumData } from '../services/pensumWidgetService';

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
  activeSubjectsCount,
  onShowToast,
}) => {
  const [total, setTotal] = useState(45);
  const [aprobadas, setAprobadas] = useState(28);
  const [enCurso, setEnCurso] = useState(activeSubjectsCount || 5);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getPensumData(activeSubjectsCount || 5).then((data: PensumData) => {
        setTotal(data.total);
        setAprobadas(data.aprobadas);
        setEnCurso(data.enCurso);
      });
    }
  }, [isOpen, activeSubjectsCount]);

  if (!isOpen) return null;

  const faltantes = Math.max(0, total - aprobadas - enCurso);
  const porcentaje = total > 0 ? Math.min(100, Math.max(0, Math.round(((aprobadas + (enCurso * 0.5)) / total) * 100))) : 0;
  const ciclosRest = enCurso > 0 ? (faltantes / enCurso).toFixed(1) : '--';

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await savePensumData(total, aprobadas, enCurso);
      triggerHaptic('success');
      onShowToast('🎉 ¡Widget de Android actualizado correctamente!');
      onClose();
    } catch {
      triggerHaptic('error');
      onShowToast('⚠️ Error al actualizar el widget');
    } finally {
      setIsSaving(false);
    }
  };

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
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider font-mono">
              WIDGET DE PENSUM (ANDROID)
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Configura cuántas materias te faltan para graduarte
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
              <Smartphone className="w-3 h-3" /> VISTA PREVIA DEL WIDGET EN EL CELULAR
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {porcentaje}% completado
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-2xl font-black font-mono text-emerald-400">{faltantes}</span>
            <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {faltantes === 1 ? 'materia por cursar' : 'materias por cursar para egresar'}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-2 rounded-full bg-zinc-700/30 overflow-hidden mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, porcentaje))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
            <div className={`p-1.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200'}`}>
              <span className="text-zinc-400 block text-[9px]">APROBADAS</span>
              <span className="font-bold text-emerald-400 text-xs">{aprobadas}</span>
            </div>
            <div className={`p-1.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200'}`}>
              <span className="text-zinc-400 block text-[9px]">EN CURSO</span>
              <span className="font-bold text-blue-400 text-xs">{enCurso}</span>
            </div>
            <div className={`p-1.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200'}`}>
              <span className="text-zinc-400 block text-[9px]">ESTIMADO</span>
              <span className="font-bold text-zinc-100 dark:text-zinc-200 text-xs">~{ciclosRest} cic</span>
            </div>
          </div>
        </div>

        {/* Formulario de Configuración */}
        <form onSubmit={handleSave} className="space-y-3.5 mb-4">
          {/* Total de materias del pensum */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Total de materias de tu pensum:
              </label>
              <span className="text-xs font-mono font-black text-blue-400">{total}</span>
            </div>
            <input
              type="range"
              min="20"
              max="65"
              value={total}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTotal(val);
                if (aprobadas > val) setAprobadas(val);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>20 materias</span>
              <span>45 estándar</span>
              <span>65 materias</span>
            </div>
          </div>

          {/* Materias ya aprobadas */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Materias que ya has aprobado:
              </label>
              <span className="text-xs font-mono font-black text-emerald-400">{aprobadas}</span>
            </div>
            <input
              type="range"
              min="0"
              max={total}
              value={aprobadas}
              onChange={(e) => setAprobadas(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>0 (Inicio)</span>
              <span>Mitad de carrera</span>
              <span>{total} (Egresado)</span>
            </div>
          </div>

          {/* Materias en curso */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Materias cursando este ciclo:
              </label>
              <span className="text-xs font-mono font-black text-blue-400">{enCurso}</span>
            </div>
            <input
              type="number"
              min="1"
              max="10"
              value={enCurso}
              onChange={(e) => setEnCurso(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-full text-xs font-mono rounded-xl px-3 py-2 outline-none border ${
                isDark
                  ? 'bg-black/30 border-white/10 text-white focus:border-white'
                  : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
              }`}
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Se sincroniza automáticamente con las materias activas de tu dashboard.
            </span>
          </div>

          {/* Botón de Guardar */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-md active:scale-98 ${
              isDark
                ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
            }`}
          >
            <Save className={`w-4 h-4 ${isDark ? '!text-black text-black' : '!text-white text-white'}`} />
            <span>{isSaving ? 'Actualizando widget...' : 'Guardar y Actualizar Widget'}</span>
          </button>
        </form>

        {/* Guía para agregarlo a la pantalla de inicio */}
        <div
          className={`p-3 rounded-2xl border text-xs ${
            isDark ? 'bg-white/[0.02] border-white/5 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] text-emerald-400 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>¿CÓMO AGREGARLO AL ESCRITORIO DE TU CELULAR?</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
            <li>Ve a la <strong>pantalla de inicio</strong> de tu teléfono.</li>
            <li>Mantén presionado tu dedo en un <strong>espacio vacío</strong>.</li>
            <li>Toca en <strong>Widgets</strong>.</li>
            <li>Busca la aplicación <strong>0</strong> (UEES Dashboard).</li>
            <li>Mantén presionado <strong>Avance de Pensum</strong> y colócalo en tu pantalla.</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
};
