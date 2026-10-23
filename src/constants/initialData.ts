import { Dashboard, WeekItem, SubjectItem } from '../types';

export const MATERIAS_DEFAULT = [
  'Bases de Datos I (Relacionales)',
  'Comunicación y Redacción',
  'Matemática II',
  'Física II',
  'Programación II',
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
      dateRange: '6 al 11 de jul 2026',
      status: 'EN PROCESO',
      subjectTasks,
      bloqueTareas: [],
    },
  ];
};

const defaultSubjects: SubjectItem[] = [
  { id: 'subj-1', name: 'Bases de Datos I (Relacionales)' },
  { id: 'subj-2', name: 'Comunicación y Redacción' },
  { id: 'subj-3', name: 'Matemática II' },
  { id: 'subj-4', name: 'Física II' },
  { id: 'subj-5', name: 'Programación II' },
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
