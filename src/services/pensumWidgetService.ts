import { registerPlugin } from '@capacitor/core';

interface PensumPluginInterface {
  getPensumData(): Promise<{ total: number; aprobadas: number; enCurso: number }>;
  updatePensumData(options: { total: number; aprobadas: number; enCurso: number }): Promise<{
    success: boolean;
    total: number;
    aprobadas: number;
    enCurso: number;
  }>;
}

const PensumWidgetPlugin = registerPlugin<PensumPluginInterface>('PensumWidget');

export interface PensumData {
  total: number;
  aprobadas: number;
  enCurso: number;
  faltantes: number;
  porcentaje: number;
  ciclosRestantes: string;
}

const STORAGE_KEY = 'uees_pensum_widget_data';

export const getPensumData = async (defaultEnCurso = 5): Promise<PensumData> => {
  let total = 45;
  let aprobadas = 28;
  let enCurso = defaultEnCurso;

  try {
    const res = await PensumWidgetPlugin.getPensumData();
    if (res && typeof res.total === 'number') {
      total = res.total;
      aprobadas = res.aprobadas;
      enCurso = res.enCurso > 0 ? res.enCurso : defaultEnCurso;
    }
  } catch {
    // Fallback web en navegador
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        total = parsed.total ?? 45;
        aprobadas = parsed.aprobadas ?? 28;
        enCurso = parsed.enCurso ?? defaultEnCurso;
      } catch {}
    }
  }

  if (aprobadas > total) aprobadas = total;
  const faltantes = Math.max(0, total - aprobadas - enCurso);
  const porcentaje = total > 0 ? Math.round(((aprobadas + (enCurso * 0.5)) / total) * 100) : 0;
  const ciclos = enCurso > 0 ? (faltantes / enCurso).toFixed(1) : '--';

  return {
    total,
    aprobadas,
    enCurso,
    faltantes,
    porcentaje: Math.min(100, Math.max(0, porcentaje)),
    ciclosRestantes: ciclos === '--' ? '--' : `~${ciclos}`,
  };
};

export const savePensumData = async (
  total: number,
  aprobadas: number,
  enCurso: number
): Promise<PensumData> => {
  if (aprobadas > total) aprobadas = total;

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ total, aprobadas, enCurso }));

  try {
    await PensumWidgetPlugin.updatePensumData({ total, aprobadas, enCurso });
  } catch {
    // Si corre en web, no hay problema
  }

  const faltantes = Math.max(0, total - aprobadas - enCurso);
  const porcentaje = total > 0 ? Math.round(((aprobadas + (enCurso * 0.5)) / total) * 100) : 0;
  const ciclos = enCurso > 0 ? (faltantes / enCurso).toFixed(1) : '--';

  return {
    total,
    aprobadas,
    enCurso,
    faltantes,
    porcentaje: Math.min(100, Math.max(0, porcentaje)),
    ciclosRestantes: ciclos === '--' ? '--' : `~${ciclos}`,
  };
};

export const syncCurrentCycleSubjects = async (subjectsCount: number): Promise<void> => {
  if (subjectsCount <= 0) return;
  const current = await getPensumData(subjectsCount);
  await savePensumData(current.total, current.aprobadas, subjectsCount);
};
