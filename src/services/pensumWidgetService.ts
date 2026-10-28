import { registerPlugin } from '@capacitor/core';

export interface TaskWidgetPayload {
  semana: number;
  pendientes: number;
  completadas: number;
  total: number;
  materias: number;
  porcentaje: number;
  proximaTarea: string;
}

interface PensumPluginInterface {
  updateTaskWidgetData(options: TaskWidgetPayload): Promise<{ success: boolean }>;
}

const PensumWidgetPlugin = registerPlugin<PensumPluginInterface>('PensumWidget');

const TASKS_STORAGE_KEY = 'uees_tasks_widget_data';

export const syncTaskWidget = async (data: TaskWidgetPayload): Promise<void> => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(data));
  } catch {}

  try {
    await PensumWidgetPlugin.updateTaskWidgetData(data);
  } catch {
    // Si corre en web, no hay problema
  }
};

export const getSavedTaskWidgetData = (): TaskWidgetPayload => {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    semana: 15,
    pendientes: 1,
    completadas: 10,
    total: 11,
    materias: 5,
    porcentaje: 91,
    proximaTarea: 'BASES DE DATOS • Tarea entregada',
  };
};
