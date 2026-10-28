import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, MapPin, Plus, Trash2, Video, Pencil, ExternalLink, ClipboardPaste } from 'lucide-react';
import { triggerHaptic } from '../services/hapticsService';

export interface ClassSlot {
  id: string;
  day: 'LUNES' | 'MARTES' | 'MIÉRCOLES' | 'JUEVES' | 'VIERNES' | 'SÁBADO';
  subjectName: string;
  timeRange: string;
  location: string;
  teamsUrl?: string;
}

export interface ClassScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const DAYS: ('LUNES' | 'MARTES' | 'MIÉRCOLES' | 'JUEVES' | 'VIERNES' | 'SÁBADO')[] = [
  'LUNES',
  'MARTES',
  'MIÉRCOLES',
  'JUEVES',
  'VIERNES',
  'SÁBADO',
];

export const DEFAULT_SCHEDULE: ClassSlot[] = [
  { id: 'cs-1', day: 'LUNES', subjectName: 'PROGRA 2', timeRange: '07:00 AM - 08:40 AM', location: 'Lab Cómputo 3' },
  { id: 'cs-2', day: 'LUNES', subjectName: 'FISICA 2', timeRange: '11:00 AM - 12:40 PM', location: 'Edificio A, Aula 12' },
  { id: 'cs-3', day: 'MARTES', subjectName: 'MATE 2', timeRange: '09:00 AM - 10:40 AM', location: 'Edificio B, Aula 04' },
  { id: 'cs-4', day: 'MARTES', subjectName: 'BASES DE DATOS', timeRange: '01:00 PM - 02:40 PM', location: 'Lab Redes 1' },
  { id: 'cs-5', day: 'MIÉRCOLES', subjectName: 'PROGRA 2', timeRange: '07:00 AM - 08:40 AM', location: 'Lab Cómputo 3' },
  { id: 'cs-6', day: 'MIÉRCOLES', subjectName: 'FISICA 2', timeRange: '11:00 AM - 12:40 PM', location: 'Edificio A, Aula 12' },
  { id: 'cs-7', day: 'JUEVES', subjectName: 'MATE 2', timeRange: '09:00 AM - 10:40 AM', location: 'Edificio B, Aula 04' },
  { id: 'cs-8', day: 'JUEVES', subjectName: 'BASES DE DATOS', timeRange: '01:00 PM - 02:40 PM', location: 'Lab Redes 1' },
  { id: 'cs-9', day: 'VIERNES', subjectName: 'REDAC Y COMU', timeRange: '08:00 AM - 10:30 AM', location: 'Aula Virtual Teams', teamsUrl: 'https://teams.microsoft.com' },
];

export const SCHEDULE_STORAGE_KEY = 'academic_class_schedule_v1';

export const getTeamsUrl = (slot: ClassSlot): string => {
  if (slot.teamsUrl && slot.teamsUrl.trim()) {
    const raw = slot.teamsUrl.trim();
    return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  }
  if (slot.location) {
    const loc = slot.location.trim();
    if (
      loc.startsWith('http://') ||
      loc.startsWith('https://') ||
      loc.includes('teams.microsoft.com') ||
      loc.includes('zoom.us') ||
      loc.includes('meet.google.')
    ) {
      return loc.startsWith('http://') || loc.startsWith('https://') ? loc : `https://${loc}`;
    }
  }
  return '';
};

export const getDisplayLocation = (slot: ClassSlot): string => {
  if (slot.location) {
    const loc = slot.location.trim();
    if (
      loc.startsWith('http://') ||
      loc.startsWith('https://') ||
      loc.includes('teams.microsoft.com') ||
      loc.includes('zoom.us') ||
      loc.includes('meet.google.')
    ) {
      return 'Aula Virtual / Teams';
    }
    return loc;
  }
  return slot.teamsUrl ? 'Aula Virtual / Teams' : 'Aula por asignar';
};

export const ClassScheduleModal: React.FC<ClassScheduleModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const todayIdx = new Date().getDay();
  const initialDay = todayIdx >= 1 && todayIdx <= 6 ? DAYS[todayIdx - 1] : 'LUNES';

  const [activeDay, setActiveDay] = useState<typeof DAYS[number]>(initialDay);
  const [schedule, setSchedule] = useState<ClassSlot[]>(() => {
    try {
      const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCHEDULE;
  });

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSubj, setNewSubj] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newTeamsUrl, setNewTeamsUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (saved) setSchedule(JSON.parse(saved));
      } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (saved) setSchedule(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('academic_data_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('academic_data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  }, [schedule]);

  if (!isOpen) return null;

  const currentDayClasses = schedule.filter((s) => s.day === activeDay);

  const handleStartAdd = () => {
    setEditingId(null);
    setNewSubj('');
    setNewTime('');
    setNewLoc('');
    setNewTeamsUrl('');
    setIsFormOpen(true);
  };

  const handleStartEdit = (slot: ClassSlot) => {
    setEditingId(slot.id);
    setNewSubj(slot.subjectName);
    setNewTime(slot.timeRange);

    const detectedTeams = getTeamsUrl(slot);
    setNewTeamsUrl(detectedTeams || slot.teamsUrl || '');

    if (slot.location && (slot.location.startsWith('http') || slot.location.includes('teams.microsoft.com'))) {
      setNewLoc('');
    } else {
      setNewLoc(slot.location || '');
    }

    setIsFormOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubj.trim()) return;

    const formattedTeamsUrl = newTeamsUrl.trim()
      ? (newTeamsUrl.trim().startsWith('http://') || newTeamsUrl.trim().startsWith('https://')
          ? newTeamsUrl.trim()
          : `https://${newTeamsUrl.trim()}`)
      : undefined;

    const formattedLoc = newLoc.trim() || (formattedTeamsUrl ? 'Aula Virtual / Teams' : 'Aula por asignar');

    if (editingId) {
      setSchedule((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                subjectName: newSubj.trim().toUpperCase(),
                timeRange: newTime.trim() || 'Horario Flexible',
                location: formattedLoc,
                teamsUrl: formattedTeamsUrl,
              }
            : s
        )
      );
    } else {
      const newSlot: ClassSlot = {
        id: `cs-${Date.now()}`,
        day: activeDay,
        subjectName: newSubj.trim().toUpperCase(),
        timeRange: newTime.trim() || 'Horario Flexible',
        location: formattedLoc,
        teamsUrl: formattedTeamsUrl,
      };
      setSchedule((prev) => [...prev, newSlot]);
    }

    setIsFormOpen(false);
    setEditingId(null);
    setNewSubj('');
    setNewTime('');
    setNewLoc('');
    setNewTeamsUrl('');

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('academic_data_synced'));
  };

  const handleDeleteClass = (id: string) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('academic_data_synced'));
  };

  const handlePasteTeamsLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewTeamsUrl(text.trim());
      }
    } catch {}
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
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
        className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-colors max-h-[90vh] flex flex-col ${
          isDark
            ? 'bg-[#131417] border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Barra superior de arrastre */}
        <div className="w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-white/20 mx-auto -mt-2 mb-3 cursor-grab active:cursor-grabbing select-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider font-mono">
                HORARIO DE CLASES
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Distribución semanal y accesos a Teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Days Horizontal Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-4 scrollbar-none font-mono shrink-0">
          {DAYS.map((d) => {
            const isToday = DAYS[todayIdx - 1] === d;
            const isSelected = activeDay === d;
            return (
              <button
                key={d}
                onClick={() => {
                  setActiveDay(d);
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer relative border ${
                  isSelected
                    ? isDark
                      ? 'bg-white !text-black text-black border-white font-black'
                      : 'bg-black !text-white text-white border-black font-black'
                    : isDark
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {d.slice(0, 3)}
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-1 mb-4 space-y-3 flex-1 scrollbar-thin">
          {/* Form to Add / Edit Class Slot */}
          {isFormOpen ? (
            <form onSubmit={handleSaveClass} className={`space-y-2.5 p-4 rounded-2xl border ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className={`flex items-center justify-between pb-1 border-b ${
                isDark ? 'border-white/10' : 'border-zinc-200'
              }`}>
                <span className="text-xs font-black uppercase tracking-wider">
                  {editingId ? '✏️ Editar Clase' : 'Agregar Clase al ' + activeDay}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{activeDay}</span>
              </div>

              <div>
                <label className={`text-[10px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Materia</label>
                <input
                  type="text"
                  placeholder="ej. MATE 2, PROGRA 2"
                  value={newSubj}
                  onChange={(e) => setNewSubj(e.target.value)}
                  className={`w-full text-xs rounded-lg px-2.5 py-1.5 outline-none border ${
                    isDark
                      ? 'bg-black/30 border-white/10 text-white focus:border-white'
                      : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                  }`}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className={`text-[10px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Horario</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ej. 07:00 AM - 08:40 AM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className={`w-full text-xs rounded-lg pl-7 pr-2.5 py-1.5 outline-none font-mono border ${
                      isDark
                        ? 'bg-black/30 border-white/10 text-white focus:border-white'
                        : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                    }`}
                  />
                  <Clock className={`w-3.5 h-3.5 absolute left-2.5 top-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                </div>
              </div>

              <div>
                <label className={`text-[10px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Aula / Lugar Físico (Opcional)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ej. Lab 3, Aula 12 o Virtual"
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    className={`w-full text-xs rounded-lg pl-7 pr-2.5 py-1.5 outline-none border ${
                      isDark
                        ? 'bg-black/30 border-white/10 text-white focus:border-white'
                        : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                    }`}
                  />
                  <MapPin className={`w-3.5 h-3.5 absolute left-2.5 top-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-[10px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Enlace de Microsoft Teams (Opcional)</label>
                  <button
                    type="button"
                    onClick={handlePasteTeamsLink}
                    className={`text-[9px] font-mono flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded border ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
                    }`}
                    title="Pegar del portapapeles"
                  >
                    <ClipboardPaste className="w-2.5 h-2.5" />
                    <span>Pegar</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://teams.microsoft.com/meet/..."
                    value={newTeamsUrl}
                    onChange={(e) => setNewTeamsUrl(e.target.value)}
                    className={`w-full text-xs rounded-lg pl-7 pr-2.5 py-1.5 outline-none font-mono border ${
                      isDark
                        ? 'bg-black/30 border-white/10 text-white focus:border-white'
                        : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900'
                    }`}
                  />
                  <Video className={`w-3.5 h-3.5 absolute left-2.5 top-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all border ${
                    isDark
                      ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                      : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                  }`}
                >
                  {editingId ? 'Guardar Cambios' : 'Guardar Clase'}
                </button>
              </div>
            </form>
          ) : null}

          {/* Class Slots for Active Day */}
          <div className="space-y-2.5 font-mono">
            {currentDayClasses.length === 0 ? (
              <div className={`p-6 text-center text-xs italic rounded-2xl border ${
                isDark ? 'border-white/5 text-zinc-400 bg-white/[0.01]' : 'border-zinc-200 text-zinc-500 bg-zinc-50'
              }`}>
                No tienes clases programadas para el {activeDay.toLowerCase()}.
              </div>
            ) : (
              currentDayClasses.map((item) => {
                const teamsLink = getTeamsUrl(item);
                const displayLoc = getDisplayLocation(item);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-white/[0.03] border-white/5 hover:border-white/15'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className={`font-extrabold text-xs block truncate ${
                          isDark ? 'text-white' : 'text-zinc-900'
                        }`}>
                          {item.subjectName}
                        </span>

                        <div className={`flex items-center gap-1.5 text-[11px] mt-1 ${
                          isDark ? 'text-zinc-300' : 'text-zinc-600'
                        }`}>
                          <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>{item.timeRange}</span>
                        </div>

                        {displayLoc && (
                          <div className={`flex items-center gap-1.5 text-[10px] mt-0.5 ${
                            isDark ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="truncate">{displayLoc}</span>
                          </div>
                        )}
                      </div>

                      {/* Item actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(item)}
                          title="Editar clase y enlace de Teams"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                            isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(item.id)}
                          title="Eliminar clase"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                            isDark ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Teams Button if available */}
                    {teamsLink ? (
                      <div className={`mt-2.5 pt-2 border-t flex items-center justify-between ${
                        isDark ? 'border-white/5' : 'border-zinc-200'
                      }`}>
                        <a
                          href={teamsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                            isDark
                              ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                              : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
                          }`}
                          title="Abrir reunión de Teams"
                        >
                          <Video className="w-3 h-3" />
                          <span>Abrir Teams</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                        <span className="text-[9px] text-emerald-500 flex items-center gap-1">
                          ● Teams vinculado
                        </span>
                      </div>
                    ) : (
                      <div className={`mt-2 pt-1.5 border-t ${isDark ? 'border-white/5' : 'border-zinc-200'}`}>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className={`text-[10px] flex items-center gap-1 cursor-pointer font-bold ${
                            isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          <Video className="w-3 h-3" />
                          <span>+ Vincular link de Teams</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`shrink-0 space-y-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
          {!isFormOpen && (
            <button
              onClick={handleStartAdd}
              className={`w-full py-2 border border-dashed rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono ${
                isDark
                  ? 'border-white/20 hover:border-white text-zinc-300 hover:bg-white/5'
                  : 'border-zinc-300 hover:border-zinc-900 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Clase al {activeDay}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
            }`}
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
