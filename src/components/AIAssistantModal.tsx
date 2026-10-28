import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../services/hapticsService';
import {
  X,
  Sparkles,
  Bot,
  Send,
  Key,
  Trash2,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Timer,
  Calculator,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ChatMessage,
  AgentContextData,
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
  validateGeminiApiKey,
  sendAgentMessage,
} from '../services/agentService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: AgentContextData;
  onExecuteAction: (action: any) => void;
  isDark?: boolean;
}

const CHAT_STORAGE_KEY = 'academic_ai_chat_history_v1';

/**
 * Renderizador de formato inline para negritas (**texto**), cursivas (*texto*) y código (`codigo`)
 * con contraste dinámico matemáticamente perfecto (WCAG AAA) para modo oscuro y claro.
 */
function renderFormattedLine(text: string, isBubbleLight: boolean): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const segments = text.split(regex);

  const boldClass = isBubbleLight ? 'font-black text-black' : 'font-black text-white';
  const italicClass = isBubbleLight ? 'italic text-zinc-700' : 'italic text-zinc-300';
  const codeClass = isBubbleLight
    ? 'font-mono bg-zinc-200 text-black px-1 py-0.5 rounded border border-zinc-300'
    : 'font-mono bg-white/10 text-white px-1 py-0.5 rounded border border-white/15';

  segments.forEach((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) {
      parts.push(
        <strong key={idx} className={boldClass}>
          {seg.slice(2, -2)}
        </strong>
      );
    } else if (seg.startsWith('*') && seg.endsWith('*') && seg.length >= 2) {
      parts.push(
        <em key={idx} className={italicClass}>
          {seg.slice(1, -1)}
        </em>
      );
    } else if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
      parts.push(
        <code key={idx} className={codeClass}>
          {seg.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(seg);
    }
  });

  return parts;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  contextData,
  onExecuteAction,
  isDark = true,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m) => ({
            ...m,
            text: m.text.replace(/Apolo/g, 'KALI'),
          }));
        }
      }
    } catch {}
    return [
      {
        id: 'msg-welcome',
        sender: 'agent',
        text: `¡Hola ${contextData.studentName}! Soy **KALI**, tu Copiloto Académica de la UEES. 🎓\n\nConozco tus 5 materias (*Bases de Datos, Programación II, Matemática II, Física II y Comunicación*), tus notas oficiales del portal y las tareas de la **Semana ${contextData.currentWeek.weekNumber}**.\n\n¿En qué te puedo apoyar hoy?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showKeySettings, setShowKeySettings] = useState<boolean>(false);
  const [apiKeyDraft, setApiKeyDraft] = useState<string>(() => getGeminiApiKey());
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getGeminiApiKey());
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const [isValidatingKey, setIsValidatingKey] = useState<boolean>(false);
  const [keyValidationFeedback, setKeyValidationFeedback] = useState<{
    valid?: boolean;
    message?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final del chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasApiKey(!!getGeminiApiKey());
    }
  }, [isOpen, messages]);

  // Manejo de gesto Atrás en Android 13 (Swipe back / Back button)
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      onClose();
    };

    window.history.pushState({ modal: 'kali_ai_modal' }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Persistir mensajes
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  const handleCopyMessage = (msgId: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {}
  };

  const handleShareMessage = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KALI • IA Académica UEES',
          text: `Plan y Consejo Académico de KALI (UEES):\n\n${text}`,
        });
        return;
      } catch {}
    }
    handleCopyMessage('share-temp', text);
  };

  const handleSaveApiKey = async () => {
    const clean = apiKeyDraft.trim();
    if (!clean) {
      clearGeminiApiKey();
      setHasApiKey(false);
      setKeyValidationFeedback(null);
      setShowKeySettings(false);
      return;
    }

    setIsValidatingKey(true);
    setKeyValidationFeedback({ message: 'Conectando con Google AI Studio para verificar la clave...' });

    const check = await validateGeminiApiKey(clean);
    setIsValidatingKey(false);

    if (check.valid) {
      setGeminiApiKey(clean);
      setHasApiKey(true);
      setKeyValidationFeedback({
        valid: true,
        message: '✓ Clave verificada y activa con Google Gemini Flash IA.',
      });
      setTimeout(() => {
        setShowKeySettings(false);
        setKeyValidationFeedback(null);
      }, 1200);
    } else {
      setGeminiApiKey(clean);
      setHasApiKey(true);
      setKeyValidationFeedback({
        valid: false,
        message: `⚠️ Google rechazó la clave: ${check.error || 'Clave no válida'}. Verifica que la hayas copiado completa de Google AI Studio.`,
      });
    }
  };

  const handleClearChat = () => {
    const fresh: ChatMessage[] = [
      {
        id: 'msg-fresh',
        sender: 'agent',
        text: `Chat reiniciado. Soy **KALI**, tu Copiloto Académica. ¿Qué duda de tus materias o tareas resolvemos ahora, ${contextData.studentName}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(fresh);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await sendAgentMessage(text, messages, contextData);

      let actionDesc: string | undefined = undefined;
      if (response.action) {
        onExecuteAction(response.action);
        if (response.action.action === 'create_task') {
          actionDesc = `✓ Actividad agregada a ${response.action.subjectName}: "${response.action.taskName}"`;
        } else if (response.action.action === 'complete_task') {
          actionDesc = `✓ Tarea marcada como entregada en ${response.action.subjectName}`;
        } else if (response.action.action === 'open_pomodoro') {
          actionDesc = `⏱️ Temporizador Pomodoro abierto`;
        } else if (response.action.action === 'open_grades') {
          actionDesc = `📊 Calculadora de Notas UEES abierta`;
        }
      }

      const agentMsg: ChatMessage = {
        id: `agt-${Date.now()}`,
        sender: 'agent',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: actionDesc ? { type: 'task_created', description: actionDesc } : undefined,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: 'Ocurrió una pequeña interrupción en la conexión. Por favor intenta de nuevo en unos segundos.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    { label: '⏰ ¿Qué entregar en 48 horas?', prompt: '¿Qué tengo que entregar en las próximas 48 horas y cuáles son las actividades más urgentes?' },
    { label: '⚡ ¿Qué estudiar hoy?', prompt: 'Analiza mis materias y notas y dime qué debería estudiar hoy para no atrasarme.' },
    { label: '⏱️ Iniciar Pomodoro', prompt: 'Recomiéndame una sesión de Pomodoro para estudiar hoy mi materia más apretada.' },
    { label: '📝 Notas de mis tareas', prompt: '¿Qué notas y apuntes rápidos tengo anotados en mis tareas de la semana?' },
    { label: '📋 ¿Qué materias tienen notas?', prompt: '¿Qué materias tienen notas?' },
    { label: '📊 ¿Cómo voy en mis materias?', prompt: '¿Cómo voy en mis notas oficiales y promedios de la UEES?' },
    { label: '🧮 ¿Cuánto necesito en R3?', prompt: '¿Cuánto necesito sacar en el Registro 3 (40%) para pasar con 6.0?' },
    { label: '👨‍🏫 Mis catedráticos', prompt: '¿Quiénes son los catedráticos de mis materias?' },
    { label: '📐 Fórmula de notas UEES', prompt: '¿Cómo se calcula el promedio y qué porcentaje tiene cada registro en la UEES?' },
  ];

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
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
        className={`relative w-full max-w-2xl h-[94dvh] sm:h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#131417] border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Barra superior visual de agarre (Pill Handle para arrastrar hacia abajo) */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-400/40 dark:bg-white/20 mx-auto mt-2.5 -mb-1 cursor-grab active:cursor-grabbing shrink-0 select-none" />

        {/* Header KALI */}
        <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-white/10 bg-[#18191e]' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-white !text-black text-black border-white' : 'bg-black !text-white text-white border-black'
              }`}>
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#131417]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm sm:text-base uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-zinc-900'
                }`}>
                  KALI • IA UEES
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                    isDark ? 'bg-white/10 text-white border-white/20' : 'bg-zinc-200 text-zinc-900 border-zinc-300'
                  }`}>
                    PRO
                  </span>
                </h3>
              </div>
              <p className={`text-[10px] sm:text-[11px] font-mono flex items-center gap-1.5 ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                <span>{hasApiKey ? '🟢 Gemini Flash IA Conectado' : '⚡ Motor Académico Local'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowKeySettings(!showKeySettings)}
              title="Configuración de API Key"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                hasApiKey
                  ? isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100'
                  : isDark ? 'text-zinc-100 bg-white/10 border border-white/20' : 'text-zinc-900 bg-zinc-200 border border-zinc-300'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearChat}
              title="Limpiar conversación"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Desplegable de Configuración de API Key */}
        {showKeySettings && (
          <div className={`p-4 border-b text-xs font-mono space-y-2 animate-fadeIn ${
            isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Clave de Google Gemini (Gratis)
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className={`text-[10px] hover:underline flex items-center gap-1 ${
                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                Obtener clave gratis <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder="Pega tu clave AIzaSy..."
                className={`flex-1 rounded-xl px-3 py-1.5 text-xs outline-none border ${
                  isDark
                    ? 'bg-black/40 border-white/15 text-white focus:border-white'
                    : 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-900'
                }`}
              />
              <button
                onClick={handleSaveApiKey}
                disabled={isValidatingKey}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 border ${
                  isDark
                    ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                    : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                }`}
              >
                {isValidatingKey ? 'Validando...' : 'Guardar'}
              </button>
              {hasApiKey && (
                <button
                  onClick={() => {
                    clearGeminiApiKey();
                    setApiKeyDraft('');
                    setHasApiKey(false);
                    setKeyValidationFeedback(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 cursor-pointer"
                >
                  Quitar
                </button>
              )}
            </div>

            {/* Mensaje de validación en tiempo real */}
            {keyValidationFeedback && (
              <div
                className={`p-2 rounded-xl text-[11px] font-mono flex items-start gap-1.5 ${
                  keyValidationFeedback.valid === true
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : keyValidationFeedback.valid === false
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : isDark ? 'bg-white/10 border border-white/20 text-zinc-200' : 'bg-zinc-100 border border-zinc-300 text-zinc-800'
                }`}
              >
                <span>{keyValidationFeedback.message}</span>
              </div>
            )}

            <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Tu clave se almacena únicamente en tu navegador/dispositivo y no se comparte con nadie.
            </p>
          </div>
        )}

        {/* Quick Prompts Bar (Adaptativo para Modo Claro y Oscuro) */}
        <div className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 ${
          isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-zinc-100 border-zinc-200'
        }`}>
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap border transition-all cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                  : 'bg-white hover:bg-zinc-200 border-zinc-300 text-zinc-800 hover:text-zinc-950 shadow-2xs'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mensajes Chat Container */}
        <div className={`flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 custom-scrollbar ${
          isDark ? 'bg-black/20' : 'bg-zinc-50'
        }`}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            // El fondo de la burbuja es claro si es usuario en modo oscuro O si es agente en modo claro
            const isBubbleLight = (isDark && isUser) || (!isDark && !isUser);

            const hasPomodoroMention = !isUser && msg.text.toLowerCase().includes('pomodoro');
            const hasGradesMention = !isUser && (msg.text.toLowerCase().includes('promedio') || msg.text.toLowerCase().includes('registro 3') || msg.text.toLowerCase().includes('calculadora'));
            const hasScheduleMention = !isUser && (msg.text.toLowerCase().includes('horario') || msg.text.toLowerCase().includes('docente') || msg.text.toLowerCase().includes('catedrático'));

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {!isUser && (
                  <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 mt-1 ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-200 border-zinc-300 text-zinc-900'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed group relative ${
                    isUser
                      ? isDark
                        ? 'bg-white !text-black text-black font-semibold shadow-md'
                        : 'bg-black !text-white text-white font-medium shadow-sm'
                      : isDark
                      ? 'bg-[#18191e] border border-white/10 text-zinc-200 shadow-xs'
                      : 'bg-white border border-zinc-200 text-zinc-900 shadow-2xs'
                  }`}
                >
                  {/* Contenido del Mensaje con formato amigable, negritas legibles y parseo de viñetas */}
                  <div className="space-y-1.5 break-words">
                    {msg.text.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) {
                        return <div key={i} className="h-1" />;
                      }

                      // Sub-viñeta / flecha
                      if (trimmed.startsWith('↳') || trimmed.startsWith('• *') || trimmed.startsWith('•*')) {
                        return (
                          <div key={i} className={`pl-3 text-[11px] flex items-start gap-1.5 ${
                            isBubbleLight ? 'text-zinc-800' : 'text-zinc-300'
                          }`}>
                            <span className="shrink-0 font-bold">↳</span>
                            <div>{renderFormattedLine(trimmed.replace(/^[↳•]\s*/, ''), isBubbleLight)}</div>
                          </div>
                        );
                      }

                      // Viñeta principal
                      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                        return (
                          <div key={i} className="flex items-start gap-1.5 my-0.5 pl-0.5">
                            <span className={`shrink-0 mt-0.5 ${isBubbleLight ? 'text-zinc-700' : 'text-zinc-400'}`}>•</span>
                            <div>{renderFormattedLine(trimmed.replace(/^[*|-|•]\s*/, ''), isBubbleLight)}</div>
                          </div>
                        );
                      }

                      return <p key={i}>{renderFormattedLine(line, isBubbleLight)}</p>;
                    })}
                  </div>

                  {/* Botones de Acción Rápida Contextuales sugeridos por KALI */}
                  {!isUser && (hasPomodoroMention || hasGradesMention || hasScheduleMention) && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-200/40 dark:border-white/10 flex flex-wrap gap-1.5">
                      {hasPomodoroMention && (
                        <button
                          onClick={() => onExecuteAction({ action: 'open_pomodoro' })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                          }`}
                        >
                          <Timer className="w-3 h-3" /> Iniciar Pomodoro
                        </button>
                      )}
                      {hasGradesMention && (
                        <button
                          onClick={() => onExecuteAction({ action: 'open_grades' })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                          }`}
                        >
                          <Calculator className="w-3 h-3" /> Ver Calculadora UEES
                        </button>
                      )}
                      {hasScheduleMention && (
                        <button
                          onClick={() => onExecuteAction({ action: 'open_schedule' })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                          }`}
                        >
                          <Calendar className="w-3 h-3" /> Ver Horario
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tarjeta de Acción Ejecutada si aplica */}
                  {msg.actionExecuted && (
                    <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{msg.actionExecuted.description}</span>
                    </div>
                  )}

                  {/* Barra de pie de mensaje: timestamp + botones de Copiar y Compartir */}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {!isUser ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          title="Copiar respuesta"
                          className={`p-1 rounded-md text-[10px] flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                            isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-black bg-zinc-100'
                          }`}
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 text-[9px]">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[9px]">Copiar</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleShareMessage(msg.text)}
                          title="Compartir"
                          className={`p-1 rounded-md text-[10px] flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                            isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-black bg-zinc-100'
                          }`}
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}

                    <span
                      className={`text-[9px] font-mono ${
                        isUser
                          ? isDark ? 'text-zinc-600' : 'text-zinc-400'
                          : isDark ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start animate-fadeIn">
              <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-200 border-zinc-300 text-zinc-900'
              }`}>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className={`rounded-2xl px-4 py-2.5 border flex items-center gap-1.5 ${
                isDark ? 'bg-[#18191e] border-white/10' : 'bg-white border-zinc-200'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-zinc-400' : 'bg-zinc-600'}`} />
                <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${isDark ? 'bg-zinc-400' : 'bg-zinc-600'}`} />
                <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s] ${isDark ? 'bg-zinc-400' : 'bg-zinc-600'}`} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar con soporte de teclado y Safe Area de Android 13 */}
        <div className={`p-3 sm:p-4 border-t shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          isDark ? 'border-white/10 bg-[#131417]' : 'border-zinc-200 bg-white'
        }`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Pregúntale a KALI o pídele una tarea..."
              disabled={isLoading}
              className={`flex-1 rounded-2xl px-4 py-3 text-xs outline-none transition-all font-mono border ${
                isDark
                  ? 'bg-black/30 border-white/15 focus:border-white text-white placeholder:text-zinc-500'
                  : 'bg-zinc-50 border-zinc-300 focus:border-zinc-900 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className={`w-11 h-11 rounded-2xl border disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                isDark
                  ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                  : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
