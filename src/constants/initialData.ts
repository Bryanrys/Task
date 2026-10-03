import { Dashboard, WeekItem, SubjectItem } from '../types';

export const MATERIAS_DEFAULT = [
  'Materia 1',
  'Materia 2',
  'Materia 3',
];

export const ACTIVIDADES_CLASES = ['Foro entregado', 'Tarea entregada'];
export const ACTIVIDADES_PARCIALES = ['Examen Parcial entregado'];

export const esSemanaDeParciales = (weekNumber: number): boolean => {
  return weekNumber > 0 && weekNumber % 6 === 0;
};

export const createDefaultWeeks = (subjectIds: string[]): WeekItem[] => {
  const subjectTasks: Record<string, { id: string; name: string; completed: boolean }[]> = {};

  subjectIds.forEach((sId) => {
    subjectTasks[sId] = ACTIVIDADES_CLASES.map((tName, tIdx) => ({
      id: `task-1-${sId}-${tIdx}`,
      name: tName,
      completed: false,
    }));
  });

  return [
    {
      id: 'week-1',
      weekNumber: 1,
      dateRange: 'Semana 1',
      status: 'EN PROCESO',
      subjectTasks,
      bloqueTareas: [],
    },
  ];
};

const defaultSubjects: SubjectItem[] = [
  { id: 'subj-1', name: 'Materia 1' },
  { id: 'subj-2', name: 'Materia 2' },
  { id: 'subj-3', name: 'Materia 3' },
];

export const INITIAL_DASHBOARDS: Dashboard[] = [
  {
    id: 'dash-starter',
    name: 'Mi Ciclo Académico',
    startDate: '01 OCT 2026',
    startDateISO: '2026-10-01',
    lastUpdated: 'Reciente',
    accessCode: 'oo',
    quickNote: 'Toca para agregar una nota o descripción...',
    subjects: defaultSubjects,
    defaultTaskNames: ACTIVIDADES_CLASES,
    weeks: createDefaultWeeks(defaultSubjects.map((s) => s.id)),
    activeWeekId: 'week-1',
  },
];
