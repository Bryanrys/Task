export interface SubjectGradeData {
  p1: string; // Registro 1 (30%)
  p2: string; // Registro 2 (30%)
  p3: string; // Registro 3 (40%)
  repo?: string; // Reposición (opcional)
  teacher?: string; // Docente asignado
  w1: number; // Ponderación Registro 1 (por defecto 30%)
  w2: number; // Ponderación Registro 2 (por defecto 30%)
  w3: number; // Ponderación Registro 3 (por defecto 40%)
}

export interface UeesGradeResult {
  r1: number | null;
  r2: number | null;
  r3: number | null;
  repo: number | null;
  effectiveR1: number;
  effectiveR2: number;
  effectiveR3: number;
  replacedRegistro: 1 | 2 | 3 | null;
  accumulated: number; // Puntos exactos acumulados (ej. 5.46)
  accumulatedFormatted: string; // Formato con 2 decimales "5.46"
  ueesAverage: number; // Promedio oficial UEES redondeado a 1 decimal (ej. 5.5)
  ueesAverageFormatted: string; // Formato oficial UEES "5.5"
  relativeAverage: string; // Promedio relativo sobre el porcentaje evaluado (ej. "9.10")
  evaluatedWeight: number; // Porcentaje evaluado (ej. 60%)
  neededInR3: string | null; // Nota requerida en Registro 3 para alcanzar passingGrade (6.0)
  isPassed: boolean; // Si ya aprobó la materia con >= passingGrade
  passedAlready: boolean; // Si ya aprobó sin importar la nota de R3
}

export const GRADES_STORAGE_KEY = 'academic_grades_tracker_v1';

// Materias oficiales y notas extraídas del portal de autogestión UEES
export const DEFAULT_UEES_GRADES: Record<string, SubjectGradeData> = {
  'Bases de Datos I (Relacionales)': {
    p1: '10.00',
    p2: '8.20',
    p3: '',
    repo: '',
    teacher: 'Rafael Alexander Torres Rodriguez',
    w1: 30,
    w2: 30,
    w3: 40,
  },
  'Comunicación y Redacción': {
    p1: '7.86',
    p2: '8.72',
    p3: '',
    repo: '',
    teacher: 'Jessica Iveth Leiva Cortez',
    w1: 30,
    w2: 30,
    w3: 40,
  },
  'Matemática II': {
    p1: '8.09',
    p2: '7.26',
    p3: '0.00',
    repo: '',
    teacher: 'Noe Salvador Chicas Romero',
    w1: 30,
    w2: 30,
    w3: 40,
  },
  'Física II': {
    p1: '7.78',
    p2: '8.20',
    p3: '',
    repo: '',
    teacher: 'Alberto Antonio Rosa Lue',
    w1: 30,
    w2: 30,
    w3: 40,
  },
  'Programación II': {
    p1: '9.88',
    p2: '8.84',
    p3: '',
    repo: '',
    teacher: 'Daniel Enrique Guevara Gomez',
    w1: 30,
    w2: 30,
    w3: 40,
  },
};

/**
 * Normaliza nombres de materias para búsqueda insensible a mayúsculas/acentos
 */
export function normalizeSubjectName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Obtiene los datos de notas guardados localmente, inicializando con los datos oficiales de UEES si está vacío
 */
export function getSavedGradesData(): Record<string, SubjectGradeData> {
  try {
    const raw = localStorage.getItem(GRADES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch {}
  return { ...DEFAULT_UEES_GRADES };
}

/**
 * Busca los datos de notas de una materia dada por su id o su nombre
 */
export function findGradeDataForSubject(
  subjectId: string,
  subjectName: string,
  gradesData: Record<string, SubjectGradeData>
): SubjectGradeData {
  if (gradesData[subjectId]) {
    return gradesData[subjectId];
  }

  const normTarget = normalizeSubjectName(subjectName);
  for (const [key, val] of Object.entries(gradesData)) {
    if (normalizeSubjectName(key) === normTarget) {
      return val;
    }
  }

  // Buscar en los predeterminados de la UEES
  for (const [name, val] of Object.entries(DEFAULT_UEES_GRADES)) {
    if (normalizeSubjectName(name) === normTarget) {
      return val;
    }
  }

  return {
    p1: '',
    p2: '',
    p3: '',
    repo: '',
    teacher: '',
    w1: 30,
    w2: 30,
    w3: 40,
  };
}

/**
 * Realiza el cálculo del promedio según la fórmula y normativa oficial de la UEES
 * - Registro 1: 30%
 * - Registro 2: 30%
 * - Registro 3: 40%
 * - Reposición: Sustituye la nota más baja que incremente el promedio ponderado.
 * - Promedio oficial UEES: Redondeo estándar a 1 cifra decimal del acumulado ponderado.
 */
export function calculateUeesGrade(
  gradeData?: SubjectGradeData,
  passingGrade = 6.0
): UeesGradeResult {
  const w1 = gradeData?.w1 ?? 30;
  const w2 = gradeData?.w2 ?? 30;
  const w3 = gradeData?.w3 ?? 40;

  const n1 = gradeData?.p1 !== undefined && gradeData.p1.trim() !== '' ? parseFloat(gradeData.p1) : null;
  const n2 = gradeData?.p2 !== undefined && gradeData.p2.trim() !== '' ? parseFloat(gradeData.p2) : null;
  const n3 = gradeData?.p3 !== undefined && gradeData.p3.trim() !== '' ? parseFloat(gradeData.p3) : null;
  const repo = gradeData?.repo !== undefined && gradeData.repo.trim() !== '' ? parseFloat(gradeData.repo) : null;

  const validN1 = n1 !== null && !isNaN(n1) ? Math.min(10, Math.max(0, n1)) : null;
  const validN2 = n2 !== null && !isNaN(n2) ? Math.min(10, Math.max(0, n2)) : null;
  const validN3 = n3 !== null && !isNaN(n3) ? Math.min(10, Math.max(0, n3)) : null;
  const validRepo = repo !== null && !isNaN(repo) ? Math.min(10, Math.max(0, repo)) : null;

  let effectiveR1 = validN1 ?? 0;
  let effectiveR2 = validN2 ?? 0;
  let effectiveR3 = validN3 ?? 0;
  let replacedRegistro: 1 | 2 | 3 | null = null;

  // Lógica de Reposición en UEES:
  // Si se ingresó nota de reposición, evalúa si reemplazando R1, R2 o R3 se obtiene una mejor nota total
  if (validRepo !== null) {
    const baseTotal = effectiveR1 * (w1 / 100) + effectiveR2 * (w2 / 100) + effectiveR3 * (w3 / 100);

    let bestTotal = baseTotal;
    let bestReplace: 1 | 2 | 3 | null = null;

    if (validN1 !== null && validRepo > validN1) {
      const option1 = validRepo * (w1 / 100) + effectiveR2 * (w2 / 100) + effectiveR3 * (w3 / 100);
      if (option1 > bestTotal) {
        bestTotal = option1;
        bestReplace = 1;
      }
    }

    if (validN2 !== null && validRepo > validN2) {
      const option2 = effectiveR1 * (w1 / 100) + validRepo * (w2 / 100) + effectiveR3 * (w3 / 100);
      if (option2 > bestTotal) {
        bestTotal = option2;
        bestReplace = 2;
      }
    }

    if (validN3 !== null && validRepo > validN3) {
      const option3 = effectiveR1 * (w1 / 100) + effectiveR2 * (w2 / 100) + validRepo * (w3 / 100);
      if (option3 > bestTotal) {
        bestTotal = option3;
        bestReplace = 3;
      }
    }

    if (bestReplace === 1) {
      effectiveR1 = validRepo;
      replacedRegistro = 1;
    } else if (bestReplace === 2) {
      effectiveR2 = validRepo;
      replacedRegistro = 2;
    } else if (bestReplace === 3) {
      effectiveR3 = validRepo;
      replacedRegistro = 3;
    }
  }

  // Ponderación y acumulado
  let accumulated = 0;
  let evaluatedWeight = 0;

  if (validN1 !== null || (replacedRegistro === 1)) {
    accumulated += effectiveR1 * (w1 / 100);
    evaluatedWeight += w1;
  }
  if (validN2 !== null || (replacedRegistro === 2)) {
    accumulated += effectiveR2 * (w2 / 100);
    evaluatedWeight += w2;
  }
  if (validN3 !== null || (replacedRegistro === 3)) {
    accumulated += effectiveR3 * (w3 / 100);
    evaluatedWeight += w3;
  }

  // Redondeo oficial UEES: Redondeo estándar a 1 decimal
  const ueesAverage = Math.round((accumulated + Number.EPSILON) * 10) / 10;
  const ueesAverageFormatted = ueesAverage.toFixed(1);
  const accumulatedFormatted = accumulated.toFixed(2);

  // Promedio relativo de las notas ya ingresadas (ej. sobre el 60%)
  const relativeAverage = evaluatedWeight > 0 ? (accumulated / (evaluatedWeight / 100)).toFixed(2) : '0.00';

  // Cálculo de nota requerida en Registro 3 (40%)
  let neededInR3: string | null = null;
  const currentEarned = effectiveR1 * (w1 / 100) + effectiveR2 * (w2 / 100);
  const missingPoints = passingGrade - currentEarned;
  const passedAlready = currentEarned >= passingGrade;

  if (validN1 !== null && validN2 !== null && (validN3 === null || validN3 === 0)) {
    if (passedAlready) {
      neededInR3 = '¡Ya aprobaste con 6.0! 🎉';
    } else {
      const needed = missingPoints / (w3 / 100);
      if (needed > 10) {
        neededInR3 = `Requiere ${needed.toFixed(2)} (supera 10.0)`;
      } else {
        neededInR3 = `${Math.max(0, needed).toFixed(2)}`;
      }
    }
  }

  const isPassed = accumulated >= passingGrade;

  return {
    r1: validN1,
    r2: validN2,
    r3: validN3,
    repo: validRepo,
    effectiveR1,
    effectiveR2,
    effectiveR3,
    replacedRegistro,
    accumulated,
    accumulatedFormatted,
    ueesAverage,
    ueesAverageFormatted,
    relativeAverage,
    evaluatedWeight,
    neededInR3,
    isPassed,
    passedAlready,
  };
}
