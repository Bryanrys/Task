import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Send,
  Key,
  Trash2,
  CheckCircle,
  HelpCircle,
  Cpu,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  ChatMessage,
  AgentContextData,
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
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
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-welcome',
        sender: 'agent',
        text: `¡Hola ${contextData.studentName}! Soy **Apolo**, tu Copiloto Académico de la UEES. 🎓\n\nConozco tus materias (*Bases de Datos, Programación, Mate II, Física y Comunicación*), tus notas oficiales y las tareas de la **Semana ${contextData.currentWeek.weekNumber}**.\n\n¿En qué te puedo apoyar hoy?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showKeySettings, setShowKeySettings] = useState<boolean>(false);
  const [apiKeyDraft, setApiKeyDraft] = useState<string>(() => getGeminiApiKey());
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getGeminiApiKey());

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

  // Persistir mensajes
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyDraft);
    setHasApiKey(!!apiKeyDraft.trim());
    setShowKeySettings(false);
  };

  const handleClearChat = () => {
    const fresh: ChatMessage[] = [
      {
        id: 'msg-fresh',
        sender: 'agent',
        text: `Chat reiniciado. ¿En qué tema de tus materias o tareas te ayudo hoy, ${contextData.studentName}?`,
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
    } catch (err) {
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
    { label: '📊 ¿Cómo voy en mis materias?', prompt: '¿Cómo voy en mis notas oficiales y promedios de la UEES?' },
    { label: '🎯 Tareas pendientes esta semana', prompt: '¿Qué tareas tengo pendientes de entregar en esta semana?' },
    { label: '⚡ ¿Qué debería estudiar hoy?', prompt: 'Analiza mis materias y notas y dime qué debería estudiar hoy para no atrasarme.' },
    { label: '🧮 ¿Cuánto necesito en R3?', prompt: '¿Cuánto necesito sacar exactamente en el Registro 3 (40%) en cada una de mis 5 materias para pasar con 6.0?' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#080b16] border-purple-500/30 text-stone-100 shadow-[0_0_50px_rgba(168,85,247,0.15)]'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header Agente */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-pink-950/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-[2px] shadow-lg shadow-purple-500/25">
                <div className="w-full h-full bg-[#0a0d17] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-pink-400" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0d17] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider font-mono text-white flex items-center gap-1.5">
                  Copiloto IA UEES
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-gradient-to-r from-pink-500 to-purple-500 text-white font-mono font-bold">
                    PRO
                  </span>
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-400 font-mono flex items-center gap-1.5">
                <span>{hasApiKey ? '🟢 Gemini 2.5 Conectado' : '⚡ Motor Académico Local'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowKeySettings(!showKeySettings)}
              title="Configuración de API Key"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                hasApiKey
                  ? 'text-stone-400 hover:text-white bg-white/5 hover:bg-white/10'
                  : 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearChat}
              title="Limpiar conversación"
              className="p-2 rounded-xl text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Desplegable de Configuración de API Key */}
        {showKeySettings && (
          <div className="p-4 bg-[#0a0d17] border-b border-purple-500/20 text-xs font-mono space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Clave de Google Gemini (Gratis)
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-pink-400 hover:underline flex items-center gap-1"
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
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-400"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition-all"
              >
                Guardar
              </button>
              {hasApiKey && (
                <button
                  onClick={() => {
                    clearGeminiApiKey();
                    setApiKeyDraft('');
                    setHasApiKey(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="text-[10px] text-stone-500">
              Tu clave se almacena únicamente en tu navegador/dispositivo y no se comparte con nadie.
            </p>
          </div>
        )}

        {/* Quick Prompts Bar */}
        <div className="px-3 py-2 border-b border-white/5 bg-[#05070e] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="py-1 px-2.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/40 border border-white/10 text-stone-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mensajes Chat Container */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-[#05070e]/60">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-md shadow-purple-500/10'
                      : 'bg-[#0e1322] border border-white/10 text-stone-200 shadow-sm'
                  }`}
                >
                  {/* Contenido del Mensaje con formato amigable */}
                  <div className="whitespace-pre-wrap break-words space-y-1">
                    {msg.text.split('\n').map((line, i) => {
                      if (line.startsWith('* ') || line.startsWith('- ')) {
                        return (
                          <div key={i} className="flex items-start gap-1.5 my-0.5">
                            <span className="text-pink-400 shrink-0">•</span>
                            <span>{line.replace(/^[*|-]\s*/, '')}</span>
                          </div>
                        );
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>

                  {/* Tarjeta de Acción Ejecutada si aplica */}
                  {msg.actionExecuted && (
                    <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{msg.actionExecuted.description}</span>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right font-mono ${
                      isUser ? 'text-purple-200/70' : 'text-stone-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start animate-fadeIn">
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 bg-[#0e1322] border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#080b16] shrink-0">
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
              placeholder="Pregúntale a tu Copiloto o pídele una tarea..."
              disabled={isLoading}
              className="flex-1 bg-[#05070e] border border-white/15 focus:border-pink-500 text-white rounded-2xl px-4 py-3 text-xs outline-none transition-all placeholder:text-stone-500 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-purple-500/25 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
