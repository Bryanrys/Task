import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays,
  CheckCircle2,
  Calculator,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  BookOpen,
  Edit3,
  Wand2,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { triggerHaptic } from '../services/hapticsService';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWeeks?: () => void;
  onScrollToSubjects?: () => void;
  onOpenCalculator?: () => void;
  onOpenSchedule?: () => void;
  onOpenPomodoro?: () => void;
  onOpenCustomizer?: () => void;
  userName?: string;
  isDark?: boolean;
}

interface TutorialStep {
  number: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  onAction?: () => void;
  tips: string[];
  previewType: 'weeks' | 'tasks' | 'grades' | 'schedule' | 'cloud_pomodoro';
}

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenWeeks,
  onScrollToSubjects,
  onOpenCalculator,
  onOpenSchedule,
  onOpenPomodoro,
  onOpenCustomizer,
  userName = 'Estudiante',
  isDark = true,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps: TutorialStep[] = [
    {
      number: 1,
      badge: 'PASO 1 • CICLO UNIVERSITARIO',
      title: 'Organización Semanal (1 a 20) & Parciales',
      subtitle: 'Control cronológico de todo tu semestre',
      description:
        'Tu ciclo académico está dividido en 20 semanas sincronizadas. El sistema detecta y activa de manera automática las semanas de evaluaciones oficiales para que nunca te tome por sorpresa una entrega.',
      icon: <CalendarDays className="w-5 h-5 text-emerald-400" />,
      actionText: 'Probar selector de semanas',
      onAction: onOpenWeeks,
      tips: [
        'Semana 6: Evaluación del Primer Parcial (P1).',
        'Semana 12: Evaluación del Segundo Parcial (P2).',
        'Semana 18: Evaluación del Tercer Parcial (P3).',
        'Puedes cambiar de semana deslizando o usando el botón Semanas arriba.',
      ],
      previewType: 'weeks',
    },
    {
      number: 2,
      badge: 'PASO 2 • MATERIAS Y ENTREGAS',
      title: 'Casillas de Tareas & Notas Rápidas',
      subtitle: 'Monitoreo de tareas por materia en tiempo real',
      description:
        'Cada materia muestra tus actividades a entregar. Marca la casilla al finalizar una tarea para elevar tu porcentaje de cumplimiento. Usa el lápiz ✏️ para añadir apuntes o fechas límite a cualquier tarea.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      actionText: 'Ver mis materias y tareas',
      onAction: onScrollToSubjects,
      tips: [
        'Toca la casilla para marcar la tarea como completada al instante.',
        'Pulsa el icono de lápiz ✏️ para registrar detalles, fecha límite o links de la tarea.',
        'El botón "+ Tarea" te permite agregar entregas extraordinarias cuando lo requieras.',
      ],
      previewType: 'tasks',
    },
    {
      number: 3,
      badge: 'PASO 3 • RENDIMIENTO ACADÉMICO',
      title: 'Calculadora & Simulador Oficial UEES',
      subtitle: 'Conoce con cuánto pasas tu materia antes del examen',
      description:
        'Sistema configurado con la ponderación oficial UEES (R1: 30%, R2: 30%, R3: 40%). Introduce tus notas de laboratorio y parcial para calcular tu acumulado exacto y simular la nota necesaria para aprobar (mínimo 6.0).',
      icon: <Calculator className="w-5 h-5 text-emerald-400" />,
      actionText: 'Abrir Calculadora UEES',
      onAction: onOpenCalculator,
      tips: [
        'Simula el examen del Parcial 3 para saber la nota mínima requerida.',
        'Activa la opción de Reposición para que el algoritmo reemplace automáticamente tu peor registro.',
        'Muestra tu estado oficial: Aprobada, En Riesgo o Con Reposición.',
      ],
      previewType: 'grades',
    },
    {
      number: 4,
      badge: 'PASO 4 • CLASES Y HORARIOS',
      title: 'Horario Inteligente & Aulas Virtuales',
      subtitle: 'Tus clases de Lunes a Sábado con acceso directo',
      description:
        'Accede a tu vista de horario para ver tus asignaturas del día. Incluye enlaces de un solo toque para ingresar a reuniones de Microsoft Teams, Google Meet o consultar el aula física en el campus.',
      icon: <Clock className="w-5 h-5 text-emerald-400" />,
      actionText: 'Ver horario de clases',
      onAction: onOpenSchedule,
      tips: [
        'Toca el botón Teams o Meet para entrar a tu aula virtual al instante.',
        'Visualiza el aula física y el horario exacto de cada cátedra.',
        'Filtra por día o activa la vista completa de la semana.',
      ],
      previewType: 'schedule',
    },
    {
      number: 5,
      badge: 'PASO 5 • PRODUCTIVIDAD TOTAL',
      title: 'Pomodoro de Estudio & Multi-Dispositivo',
      subtitle: 'Concentración y respaldo seguro en Celular y Web',
      description:
        'Aprovecha el temporizador Pomodoro integrado (25 min de estudio / 5 min de descanso) con avisos sonoros. Además, tu cuenta y dashboard se sincronizan de forma privada en la nube para que accedas desde tu móvil o PC.',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      actionText: 'Probar Pomodoro de estudio',
      onAction: onOpenPomodoro,
      tips: [
        'En Android: Recibe notificaciones flotantes de tareas pendientes.',
        'Sincronización multi-dispositivo: Puedes iniciar sesión en la Web o en la app móvil.',
        'Tus datos y notas personales están respaldados en tu perfil privado.',
      ],
      previewType: 'cloud_pomodoro',
    },
  ];

  const activeStepData = steps[currentStep - 1];

  const handleNext = () => {
    triggerHaptic();
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    triggerHaptic();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    triggerHaptic();
    onClose();
  };

  const handleOpenCreation = () => {
    triggerHaptic();
    onClose();
    if (onOpenCustomizer) {
      onOpenCustomizer();
    }
  };

  const handleInteractiveAction = () => {
    triggerHaptic();
    if (activeStepData.onAction) {
      activeStepData.onAction();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none transition-all"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`relative w-full max-w-[480px] rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] ${
          isDark
            ? 'bg-[#0c0e14]/95 border-white/15 text-white shadow-black/90 backdrop-blur-md'
            : 'bg-white/95 border-zinc-300 text-zinc-900 shadow-xl backdrop-blur-md'
        }`}
      >
        {/* Header Decorativo con Progreso y Título */}
        <div className={`p-4 sm:p-5 border-b relative ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-white/5 border-white/10 text-emerald-400' : 'bg-white border-zinc-200 text-emerald-600'
              }`}>
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Tutorial Interactivo en Vivo
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-xs font-bold font-mono">
                  Paso {currentStep} de {steps.length} • {activeStepData.title.split('&')[0].trim()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                  : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Cerrar tutorial y explorar libremente"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de progreso de pasos interactiva */}
          <div className="grid grid-cols-5 gap-1.5">
            {steps.map((st) => (
              <button
                key={st.number}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setCurrentStep(st.number);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  st.number === currentStep
                    ? isDark
                      ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                      : 'bg-black shadow-xs'
                    : st.number < currentStep
                    ? 'bg-emerald-500'
                    : isDark
                    ? 'bg-white/15 hover:bg-white/25'
                    : 'bg-zinc-200 hover:bg-zinc-300'
                }`}
                title={`Ir al paso ${st.number}`}
              />
            ))}
          </div>
        </div>

        {/* Contenido deslizable del paso */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStepData.number}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5"
            >
              {/* Badge y Título */}
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border mb-1.5 ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <Zap className="w-3 h-3" />
                  {activeStepData.badge}
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight font-mono">
                  {activeStepData.title}
                </h3>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {activeStepData.subtitle}
                </p>
              </div>

              {/* Botón de Acción Interactiva en Vivo en la App */}
              {activeStepData.onAction && (
                <button
                  type="button"
                  onClick={handleInteractiveAction}
                  className={`w-full py-2 px-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-98 ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-900'
                  }`}
                  title="Ejecutar esta función en la app ahora mismo"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Acción en la app: {activeStepData.actionText}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              )}

              {/* Vista didáctica del paso */}
              <div className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-zinc-50 border-zinc-200'
              }`}>
                {activeStepData.previewType === 'weeks' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" /> Semana Activa del Ciclo
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] border ${
                        isDark ? 'bg-white/10 border-white/10 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-800'
                      }`}>
                        Ciclo II • 2026
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                      <div className={`p-2 rounded-xl border text-center ${
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-zinc-300 font-bold'
                      }`}>
                        <span className="block text-[9px] text-emerald-400 font-bold">EN CURSO</span>
                        <span>Semana 1</span>
                      </div>
                      <div className={`p-2 rounded-xl border text-center ${
                        isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                      }`}>
                        <span className="block text-[9px] text-zinc-400 font-bold">REGULAR</span>
                        <span>Semana 2</span>
                      </div>
                      <div className={`p-2 rounded-xl border text-center ${
                        isDark ? 'bg-white/10 border-white/20 text-white font-bold' : 'bg-zinc-200 border-zinc-300 text-zinc-900 font-bold'
                      }`}>
                        <span className="block text-[9px] font-bold text-emerald-400">PARCIAL 1</span>
                        <span>Semana 6</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStepData.previewType === 'tasks' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                        Programación Web
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">100% Entregado</span>
                    </div>
                    <div className={`p-2 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-black font-black text-[10px]">
                          ✓
                        </div>
                        <span className="line-through text-zinc-400 text-[11px]">Laboratorio 1 subido al campus</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Edit3 className="w-3 h-3 text-emerald-400" />
                        <span>Nota</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStepData.previewType === 'grades' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Promedio Simulado UEES</span>
                      <span className="text-emerald-400 font-black text-sm">8.4 / 10.0</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                        <span className="block text-zinc-400">R1 (30%)</span>
                        <span className="font-bold">8.5</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                        <span className="block text-zinc-400">R2 (30%)</span>
                        <span className="font-bold">8.0</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                        <span className="block text-[9px]">R3 (40%)</span>
                        <span className="font-bold">Min: 4.8</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStepData.previewType === 'schedule' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold">Lunes • 07:00 AM - 09:00 AM</span>
                      <span className="text-emerald-400 font-bold">Aula Presencial / Teams</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
                    }`}>
                      <div>
                        <p className="font-bold text-[11px]">Base de Datos I</p>
                        <p className="text-[10px] text-zinc-400">Edificio 2 • Aula 204</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black text-white border-black'
                      }`}>
                        Abrir Teams ↗
                      </span>
                    </div>
                  </div>
                )}

                {activeStepData.previewType === 'cloud_pomodoro' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        Multi-Dispositivo Sincronizado
                      </span>
                      <span className="text-emerald-400 text-[10px] font-bold">Activo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-center text-[10px]">
                      <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                        <span className="block text-zinc-400">🍅 Pomodoro</span>
                        <span className="font-bold text-xs">25:00 min</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                        <span className="block text-zinc-400">☁️ Supabase</span>
                        <span className="font-bold text-xs">Celular ⇄ Web</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Explicación en texto */}
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {activeStepData.description}
              </p>

              {/* Tips o claves del paso */}
              <div className={`p-3 rounded-2xl border space-y-1.5 ${
                isDark ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-100/70 border-zinc-200'
              }`}>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  Puntos Clave del Paso:
                </span>
                <ul className="space-y-1 text-[11px] leading-snug">
                  {activeStepData.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer con Controles de Navegación */}
        <div className={`p-4 sm:p-5 border-t space-y-2.5 ${isDark ? 'border-white/10 bg-[#0a0c10]' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex items-center gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  isDark
                    ? 'border-white/10 text-zinc-300 hover:text-white hover:bg-white/5'
                    : 'border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold font-mono cursor-pointer transition-all ${
                  isDark
                    ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                    : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                Omitir
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-all border shadow-md active:scale-98 ${
                isDark
                  ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                  : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
              }`}
            >
              <span>{currentStep === steps.length ? '¡Comenzar mi Dashboard!' : 'Siguiente Paso'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Opción para Crear / Personalizar Dashboard con sus propias materias */}
          {onOpenCustomizer && (
            <button
              type="button"
              onClick={handleOpenCreation}
              className={`w-full py-2 px-3 rounded-xl border text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                  : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>O personalizar mis propias materias y fechas</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
