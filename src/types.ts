export interface TaskItem {
  id: string;
  name: string;
  completed: boolean;
  note?: string;
  deadlineISO?: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  color?: string;
}

export interface WeekItem {
  id: string;
  weekNumber: number;
  dateRange: string;
  status: 'COMPLETADO' | 'EN PROCESO' | 'PENDIENTE';
  // map of subjectId -> TaskItem[]
  subjectTasks: Record<string, TaskItem[]>;
  bloqueTareas?: { id: string; texto: string; completada: boolean }[];
}

export interface Dashboard {
  id: string;
  name: string; // e.g. "UEES" or "Dashboard 1"
  startDate: string; // e.g. "06 JUL 2026"
  startDateISO?: string; // e.g. "2026-07-06"
  lastUpdated: string; // e.g. "28 sept 2026, 21:58"
  subjects: SubjectItem[];
  defaultTaskNames: string[]; // e.g. ["Tarea entregada", "Examen Parcial entregado"]
  weeks: WeekItem[];
  activeWeekId: string;
  accessCode: string;
  quickNote?: string;
}
