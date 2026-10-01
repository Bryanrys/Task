import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

export interface ClassSlot {
  id: string;
  day: 'LUNES' | 'MARTES' | 'MIÉRCOLES' | 'JUEVES' | 'VIERNES' | 'SÁBADO';
  subjectName: string;
  timeRange: string;
  location: string;
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
  { id: 'cs-9', day: 'VIERNES', subjectName: 'REDAC Y COMU', timeRange: '08:00 AM - 10:30 AM', location: 'Aula Virtual Teams' },
];

export const SCHEDULE_STORAGE_KEY = 'academic_class_schedule_v1';

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

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newSubj, setNewSubj] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLoc, setNewLoc] = useState('');

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

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubj.trim()) return;

    const newSlot: ClassSlot = {
      id: `cs-${Date.now()}`,
      day: activeDay,
      subjectName: newSubj.trim().toUpperCase(),
      timeRange: newTime.trim() || 'Horario Flexible',
      location: newLoc.trim() || 'Aula por asignar',
    };

    setSchedule((prev) => [...prev, newSlot]);
    setNewSubj('');
    setNewTime('');
    setNewLoc('');
    setIsAdding(false);
  };

  const handleDeleteClass = (id: string) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#141210] border-[#292524] text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider font-mono">
                HORARIO DE CLASES
              </h3>
              <p className="text-[11px] text-stone-400">Distribución semanal de materias</p>
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
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-4 scrollbar-none font-mono">
          {DAYS.map((d) => {
            const isToday = DAYS[todayIdx - 1] === d;
            return (
              <button
                key={d}
                onClick={() => {
                  setActiveDay(d);
                  setIsAdding(false);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                  activeDay === d
                    ? 'bg-yellow-400 text-black shadow-xs font-extrabold'
                    : isDark
                    ? 'bg-[#1c1917] border border-[#2b2724] text-stone-300 hover:border-stone-500'
                    : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
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

        {/* Class Slots for Active Day */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 mb-4 font-mono">
          {currentDayClasses.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 italic">
              No tienes clases programadas para el {activeDay.toLowerCase()}.
            </div>
          ) : (
            currentDayClasses.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex items-start justify-between ${
                  isDark
                    ? 'bg-[#1a1715] border-[#292524] hover:border-[#38332e]'
                    : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs text-yellow-500 block">
                    {item.subjectName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-300 mt-1">
                    <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{item.timeRange}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[200px]">{item.location}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteClass(item.id)}
                  title="Eliminar clase"
                  className="text-stone-500 hover:text-rose-400 p-1 transition-colors cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Form to Add New Class Slot */}
        {isAdding ? (
          <form onSubmit={handleAddClass} className="space-y-2 p-3 rounded-2xl border bg-stone-900/40 border-stone-700/50 mb-3">
            <input
              type="text"
              placeholder="Materia (ej. PROGRA 2)"
              value={newSubj}
              onChange={(e) => setNewSubj(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-yellow-400"
              autoFocus
            />
            <input
              type="text"
              placeholder="Horario (ej. 07:00 AM - 08:40 AM)"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-yellow-400"
            />
            <input
              type="text"
              placeholder="Lugar o Aula (ej. Lab 3 o Teams)"
              value={newLoc}
              onChange={(e) => setNewLoc(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-yellow-400"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-1.5 text-xs text-stone-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 bg-yellow-400 text-black font-extrabold text-xs rounded-lg cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 mb-2 border border-dashed border-stone-700 hover:border-yellow-400/60 rounded-xl text-xs font-bold text-stone-400 hover:text-yellow-400 transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Agregar Clase al {activeDay}</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
