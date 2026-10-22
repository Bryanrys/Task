import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Plus, Trash2, Video, Pencil, ExternalLink, ClipboardPaste } from 'lucide-react';

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

/**
 * Extrae la URL de Teams o reunión de un slot de clase.
 * Detecta tanto la propiedad teamsUrl como enlaces HTTP/Teams guardados previamente en location.
 */
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

/**
 * Retorna una descripción limpia de la ubicación, evitando mostrar enlaces crudos largos.
 */
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
  // Determine today's day of week
  const todayIdx = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
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

  // Reload when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (saved) setSchedule(JSON.parse(saved));
      } catch {}
    }
  }, [isOpen]);

  // Live sync with cloud downloads
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

    // Si location era la URL de Teams, asignamos una etiqueta limpia
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

    // Disparar sincronización
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
    } catch {
      // Si no hay permiso de portapapeles, el usuario puede pegar manualmente con Ctrl+V
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-colors max-h-[90vh] flex flex-col ${
          isDark
            ? 'bg-[#0a0d17] border-white/10 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider font-mono">
                HORARIO DE CLASES
              </h3>
              <p className="text-[11px] text-stone-400">Distribución semanal y accesos a Teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Days Horizontal Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-4 scrollbar-none font-mono shrink-0">
          {DAYS.map((d) => {
            const isToday = DAYS[todayIdx - 1] === d;
            return (
              <button
                key={d}
                onClick={() => {
                  setActiveDay(d);
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                  activeDay === d
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs font-extrabold'
                    : isDark
                    ? 'bg-[#05070e] border border-white/10 text-stone-300 hover:border-cyan-500/40'
                    : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {d.slice(0, 3)}
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-1 mb-4 space-y-3 flex-1 scrollbar-thin">
          {/* Form to Add / Edit Class Slot */}
          {isFormOpen ? (
            <form onSubmit={handleSaveClass} className="space-y-2.5 p-4 rounded-2xl border bg-[#05070e] border-cyan-500/30 shadow-lg">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-black uppercase text-cyan-300 tracking-wider">
                  {editingId ? '✏️ Editar Clase' : '+ Agregar Clase al ' + activeDay}
                </span>
                <span className="text-[10px] font-mono text-stone-400">{activeDay}</span>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-1 font-semibold">Materia</label>
                <input
                  type="text"
                  placeholder="ej. MATE 2, PROGRA 2"
                  value={newSubj}
                  onChange={(e) => setNewSubj(e.target.value)}
                  className="w-full text-xs bg-[#0a0d17] border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-1 font-semibold">Horario</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ej. 6:00 a 8:00 o 07:00 AM - 08:40 AM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs bg-[#0a0d17] border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 text-white outline-none focus:border-cyan-400 font-mono"
                  />
                  <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-1 font-semibold">Aula / Lugar Físico (Opcional)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ej. Lab 3, Aula 12 o Virtual"
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    className="w-full text-xs bg-[#0a0d17] border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                  />
                  <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                </div>
              </div>

              {/* Dedicated Teams Link Field */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                    <Video className="w-3 h-3 text-indigo-400" />
                    <span>Link de Microsoft Teams / Reunión</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteTeamsLink}
                    className="text-[10px] font-mono text-indigo-300 hover:text-white flex items-center gap-0.5 cursor-pointer bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                    title="Pegar enlace desde el portapapeles"
                  >
                    <ClipboardPaste className="w-2.5 h-2.5" />
                    <span>Pegar</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://teams.microsoft.com/meet/..."
                  value={newTeamsUrl}
                  onChange={(e) => setNewTeamsUrl(e.target.value)}
                  className="w-full text-xs bg-[#0a0d17] border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-indigo-400 font-mono placeholder:text-stone-500"
                />
                <p className="text-[9px] text-stone-400 mt-1">
                  Pega aquí el enlace de Teams para unirte directamente con un botón en el inicio.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="flex-1 py-1.5 text-xs text-stone-400 hover:text-white cursor-pointer bg-white/5 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs rounded-lg cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  {editingId ? 'Guardar Cambios' : 'Guardar Clase'}
                </button>
              </div>
            </form>
          ) : null}

          {/* Class Slots for Active Day */}
          <div className="space-y-2.5 font-mono">
            {currentDayClasses.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 italic rounded-2xl border border-white/5 bg-white/[0.01]">
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
                        ? 'bg-[#05070e] border-white/10 hover:border-cyan-500/40'
                        : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs text-cyan-300 block truncate">
                          {item.subjectName}
                        </span>

                        <div className="flex items-center gap-1.5 text-[11px] text-stone-300 mt-1">
                          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{item.timeRange}</span>
                        </div>

                        {displayLoc && (
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">{displayLoc}</span>
                          </div>
                        )}
                      </div>

                      {/* Item actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(item)}
                          title="Editar clase y enlace de Teams"
                          className="text-stone-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(item.id)}
                          title="Eliminar clase"
                          className="text-stone-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Teams Button if available */}
                    {teamsLink ? (
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                        <a
                          href={teamsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 text-[10px] font-bold transition-all cursor-pointer"
                          title="Abrir reunión de Teams"
                        >
                          <Video className="w-3 h-3 text-indigo-400" />
                          <span>Abrir Teams</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                        <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                          ● Teams vinculado
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 pt-1.5 border-t border-white/5">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Video className="w-3 h-3 text-indigo-400" />
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
        <div className="shrink-0 space-y-2 pt-2 border-t border-white/10">
          {!isFormOpen && (
            <button
              onClick={handleStartAdd}
              className="w-full py-2 border border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl text-xs font-bold text-cyan-300 hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Agregar Clase al {activeDay}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

