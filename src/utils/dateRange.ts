/**
 * Utilidades para cálculo y formateo de rangos de fechas por semana académica.
 */

export const UEES_PRESET_RANGES: Record<number, string> = {
  1: '6 al 11 de jul 2026',
  2: '13 al 18 de jul 2026',
  3: '20 al 25 de jul 2026',
  4: '27 jul al 1 de ago 2026',
  5: '10 al 15 de ago 2026',
  6: '17 al 22 de ago 2026',
  7: '24 al 29 de ago 2026',
  8: '31 ago al 5 sep 2026',
  9: '7 al 12 de sep 2026',
  10: '14 al 19 de sep 2026',
  11: '21 al 26 de sep 2026',
  12: '28 sep al 3 oct 2026',
  13: '5 al 10 de oct 2026',
  14: '12 al 17 de oct 2026',
  15: '19 al 24 de oct 2026',
  16: '26 al 31 de oct 2026',
  17: '2 al 7 de nov 2026',
  18: '9 al 14 de nov 2026',
  19: '16 al 21 de nov 2026',
  20: '23 al 28 de nov 2026',
  21: '30 nov al 5 de dic 2026',
  22: '7 al 12 de dic 2026',
  23: '14 al 19 de dic 2026',
  24: '21 al 26 de dic 2026',
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Calcula algorítmicamente el rango de fechas de una semana (de lunes a sábado).
 * Considera la fecha de inicio del ciclo configurada en el dashboard.
 */
export function computeWeekRangeFromDate(weekNumber: number, startDateISO?: string): string {
  const isDefaultUees = !startDateISO || startDateISO === '2026-07-06';
  if (isDefaultUees && UEES_PRESET_RANGES[weekNumber]) {
    return UEES_PRESET_RANGES[weekNumber];
  }

  const baseDate = startDateISO ? new Date(`${startDateISO}T00:00:00`) : new Date('2026-07-06T00:00:00');
  if (isNaN(baseDate.getTime())) {
    return UEES_PRESET_RANGES[weekNumber] || `Semana ${weekNumber}`;
  }

  // Ajustar al lunes de la primera semana
  const dayOfWeek = baseDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
  const firstMonday = new Date(baseDate);
  firstMonday.setDate(firstMonday.getDate() + diffToMonday);

  // Si es el ciclo UEES estándar de 2026, hay 1 semana de pausa por vacaciones de agosto entre semana 4 y 5
  let extraWeeks = 0;
  if (isDefaultUees && weekNumber >= 5) {
    extraWeeks = 1;
  }

  const weekStart = new Date(firstMonday);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1 + extraWeeks) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 5); // Hasta sábado

  const startDay = weekStart.getDate();
  const startMonth = MESES[weekStart.getMonth()];
  const endDay = weekEnd.getDate();
  const endMonth = MESES[weekEnd.getMonth()];
  const endYear = weekEnd.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} al ${endDay} de ${endMonth} ${endYear}`;
  } else {
    return `${startDay} ${startMonth} al ${endDay} ${endMonth} ${endYear}`;
  }
}

/**
 * Si la semana ya tiene un rango válido guardado (ej: "28 sep al 3 oct 2026"), lo conserva.
 * Si no tiene o contiene el texto genérico por defecto "Semana X", lo resuelve automáticamente con las fechas reales.
 */
export function formatOrResolveWeekDateRange(
  weekNumber: number,
  startDateISO?: string,
  existingRange?: string
): string {
  if (existingRange && typeof existingRange === 'string') {
    const trimmed = existingRange.trim();
    const isGeneric = /^semana\s*\d*$/i.test(trimmed) || trimmed === '';
    if (!isGeneric) {
      return trimmed;
    }
  }

  return computeWeekRangeFromDate(weekNumber, startDateISO);
}
