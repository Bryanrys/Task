import { Dashboard, WeekItem, SubjectItem } from '../types';

export const MATERIAS_DEFAULT = [
  'PROGRA 2',
  'MATE 2',
  'FISICA 2',
  'REDAC Y COMU',
  'BASES DE DATOS',
];

export const ACTIVIDADES_CLASES = ['Foro entregado', 'Tarea entregada'];
export const ACTIVIDADES_PARCIALES = ['Examen Parcial entregado'];

export const esSemanaDeParciales = (weekNumber: number): boolean => {
  return weekNumber > 0 && weekNumber % 6 === 0;
};

export const createDefaultWeeks = (subjectIds: string[]): WeekItem[] => {
  const weeksData = [
    { num: 1, range: '6 al 11 de jul 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 2, range: '13 al 18 de jul 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 3, range: '20 al 25 de jul 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 4, range: '27 jul al 1 de ago 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 5, range: '10 al 15 de ago 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 6, range: '17 al 22 de ago 2026', status: 'COMPLETADO' as const, allDone: true }, // Parcial 1
    { num: 7, range: '24 al 29 de ago 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 8, range: '31 ago al 5 sep 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 9, range: '7 al 12 de sep 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 10, range: '14 al 19 de sep 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 11, range: '21 al 26 de sep 2026', status: 'COMPLETADO' as const, allDone: true },
    { num: 12, range: '28 sep al 3 oct 2026', status: 'EN PROCESO' as const, allDone: false }, // Parcial 2
  ];

  return weeksData.map((w) => {
    const isParcial = esSemanaDeParciales(w.num);
    const taskNames = isParcial ? ACTIVIDADES_PARCIALES : ACTIVIDADES_CLASES;
    const subjectTasks: Record<string, { id: string; name: string; completed: boolean }[]> = {};

    subjectIds.forEach((sId, sIdx) => {
      // In week 12 (active in video), PROGRA 2 or MATE 2 has 1 checked
      const isCompleted = w.allDone || (w.num === 12 && sIdx === 0);
      subjectTasks[sId] = taskNames.map((tName, tIdx) => ({
        id: `task-${w.num}-${sId}-${tIdx}`,
        name: tName,
        completed: isCompleted,
      }));
    });

    return {
      id: `week-${w.num}`,
      weekNumber: w.num,
      dateRange: w.range,
      status: w.status,
      subjectTasks,
      bloqueTareas: [],
    };
  });
};

const defaultSubjects: SubjectItem[] = [
  { id: 'subj-0', name: 'PROGRA 2' },
  { id: 'subj-1', name: 'MATE 2' },
  { id: 'subj-2', name: 'FISICA 2' },
  { id: 'subj-3', name: 'REDAC Y COMU' },
  { id: 'subj-4', name: 'BASES DE DATOS' },
];

export const INITIAL_DASHBOARDS: Dashboard[] = [
  {
    id: 'dash-uees',
    name: 'UEES',
    startDate: '06 JUL 2026',
    startDateISO: '2026-07-06',
    lastUpdated: '28 sept 2026, 21:58',
    accessCode: 'oo',
    quickNote: 'Semestre Académico 2026-II',
    subjects: defaultSubjects,
    defaultTaskNames: ACTIVIDADES_CLASES,
    weeks: createDefaultWeeks(defaultSubjects.map((s) => s.id)),
    activeWeekId: 'week-12',
  },
];
