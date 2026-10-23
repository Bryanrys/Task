import { GoogleGenAI } from '@google/genai/web';
import { Dashboard, WeekItem, SubjectItem, TaskItem } from '../types';
import {
  SubjectGradeData,
  calculateUeesGrade,
  findGradeDataForSubject,
  getSavedGradesData,
} from '../utils/gradeCalculation';

export const GEMINI_API_KEY_STORAGE = 'gemini_api_key_v1';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  actionExecuted?: {
    type: 'task_created' | 'task_completed' | 'schedule_view' | 'grades_view';
    description: string;
  };
}

export interface AgentContextData {
  studentName: string;
  activeDashboard: Dashboard;
  currentWeek: WeekItem;
  gradesData: Record<string, SubjectGradeData>;
}

/**
 * Obtiene la API Key configurada
 */
export function getGeminiApiKey(): string {
  try {
    const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    if (stored && stored.trim() !== '') return stored.trim();
  } catch {}
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
}

/**
 * Guarda la API Key en localStorage
 */
export function setGeminiApiKey(key: string): void {
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
    window.dispatchEvent(new Event('gemini_api_key_changed'));
  } catch {}
}

/**
 * Elimina la API Key
 */
export function clearGeminiApiKey(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    window.dispatchEvent(new Event('gemini_api_key_changed'));
  } catch {}
}

/**
 * Valida la API Key directamente contra los servidores de Google Generative AI
 */
export async function validateGeminiApiKey(
  key: string
): Promise<{ valid: boolean; error?: string }> {
  const cleanKey = key.trim();
  if (!cleanKey) return { valid: false, error: 'La clave está vacía.' };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cleanKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hola' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (res.ok) {
      return { valid: true };
    }

    const data = await res.json().catch(() => ({}));
    const rawError = data?.error?.message || `Error HTTP ${res.status}`;
    let userMsg = rawError;
    if (rawError.includes('API key not valid') || rawError.includes('API_KEY_INVALID')) {
      userMsg = 'Google rechazó la API Key (API key no válida o mal copiada).';
    } else if (rawError.includes('quota') || data?.error?.status === 'RESOURCE_EXHAUSTED') {
      userMsg = 'La clave ha agotado su cuota gratuita en Google Cloud.';
    }
    return { valid: false, error: userMsg };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Error de conexión de red.' };
  }
}

/**
 * Construye el prompt de sistema con todos los datos académicos del estudiante en vivo
 */
export function buildSystemInstruction(context: AgentContextData): string {
  const { studentName, activeDashboard, currentWeek, gradesData } = context;

  // Resumen de calificaciones oficiales UEES
  const gradesSummary = activeDashboard.subjects
    .map((s) => {
      const g = findGradeDataForSubject(s.id, s.name, gradesData);
      const calc = calculateUeesGrade(g);
      return `- Materia: "${s.name}"
  * Docente: ${g.teacher || 'Catedrático UEES'}
  * Registro 1 (30%): ${g.p1 || 'Sin ingresar'}
  * Registro 2 (30%): ${g.p2 || 'Sin ingresar'}
  * Registro 3 (40%): ${g.p3 || 'Pendiente'}
  * Reposición: ${g.repo || 'No aplica'}
  * Promedio Oficial UEES: ${calc.ueesAverageFormatted} (Acumulado exacto: ${calc.accumulatedFormatted}/10.0)
  * Estado: ${calc.isPassed ? 'Aprobada (>= 6.0)' : calc.passedAlready ? 'Puntos suficientes acumulados' : `Requiere ${calc.neededInR3 || 'calificación'} en Registro 3 para aprobar`}`;
    })
    .join('\n');

  // Resumen de tareas de la semana activa (incluyendo notas y apuntes rápidos)
  const tasksSummary = activeDashboard.subjects
    .map((s) => {
      const tasks = currentWeek.subjectTasks[s.id] || [];
      const taskLines = tasks.map(
        (t) => `  * ${t.name} [${t.completed ? 'Completada' : 'Pendiente'}]${t.note ? ` -> Nota rápida/Apunte: "${t.note}"` : ''}`
      );
      return `- ${s.name}:\n${taskLines.join('\n') || '  (Sin tareas)'}`;
    })
    .join('\n');

  return `Eres "KALI", la Copiloto y Agente de Inteligencia Artificial Académica de la Universidad Evangélica de El Salvador (UEES) diseñada para asistir a ${studentName}.
Tu nombre es KALI. Hablas siempre en español con tono amigable, ágil, altamente estructurado, motivador y profesional.

CONTEXTO ACADÉMICO DEL ESTUDIANTE EN TIEMPO REAL:
Estudiante: ${studentName}
Ciclo: ${activeDashboard.name} (Inició: ${activeDashboard.startDate})
Semana Activa: Semana ${currentWeek.weekNumber} (${currentWeek.dateRange})
Estado de la semana: ${currentWeek.status}

SISTEMA DE CALIFICACIONES OFICIAL UEES:
Ponderaciones: Registro 1 = 30%, Registro 2 = 30%, Registro 3 = 40%.
Nota de Aprobación Mínima: 6.0.

ESTADO OFICIAL DE SUS 5 MATERIAS Y NOTAS:
${gradesSummary}

TAREAS Y NOTAS RÁPIDAS DE LA SEMANA ACTUAL (${currentWeek.dateRange}):
${tasksSummary}

REGLAS DE CONDUCTA DE KALI:
1. Conoces exactamente las 5 materias de Bryan (Bases de Datos I, Comunicación y Redacción, Matemática II, Física II, Programación II), el cálculo oficial de notas y sus apuntes de tareas.
2. Si el estudiante te pide analizar qué estudiar hoy para no atrasarse, dale un plan estratégico priorizando las materias con cómputo más bajo (como Matemática II) y revisando sus notas rápidas (ej. "Me falta uno toidavia", "falta mandarla").
3. Si el estudiante te pide agregar o crear una tarea, o marcar una tarea como completada, responde de forma conversacional y añade al FINAL de tu respuesta un bloque JSON con la acción estructurada para que la app la ejecute automáticamente:
\`\`\`action
{"action": "create_task", "subjectName": "Nombre Materia", "taskName": "Nombre de la Tarea"}
\`\`\`
O para completar:
\`\`\`action
{"action": "complete_task", "subjectName": "Nombre Materia", "taskName": "Nombre de la Tarea"}
\`\`\`
4. Responde con calidez, formato limpio en viñetas y negritas, sin redundancias secas.`;
}

/**
 * Extrae y ejecuta acciones detectadas en la respuesta del agente
 */
export function extractAgentAction(
  responseText: string
): { text: string; action: any | null } {
  const match = responseText.match(/```action\s*([\s\S]*?)\s*```/);
  if (!match) {
    return { text: responseText.trim(), action: null };
  }

  const cleanText = responseText.replace(/```action[\s\S]*?```/, '').trim();
  try {
    const action = JSON.parse(match[1]);
    return { text: cleanText, action };
  } catch {
    return { text: cleanText, action: null };
  }
}

/**
 * Motor de Fallback inteligente (offline o sin API Key) con lógica adaptativa de KALI
 */
export function generateLocalFallbackResponse(
  prompt: string,
  context: AgentContextData
): { text: string; action: any | null } {
  const p = prompt.toLowerCase().trim();
  const { activeDashboard, currentWeek, gradesData } = context;

  // Analizar datos de todas las materias
  const subjectsReport = activeDashboard.subjects.map((s) => {
    const g = findGradeDataForSubject(s.id, s.name, gradesData);
    const c = calculateUeesGrade(g);
    const hasR1 = g.p1 !== undefined && g.p1.trim() !== '';
    const hasR2 = g.p2 !== undefined && g.p2.trim() !== '';
    const hasR3 = g.p3 !== undefined && g.p3.trim() !== '';
    const hasAnyGrade = hasR1 || hasR2 || hasR3;
    return {
      subject: s,
      gradeData: g,
      calc: c,
      hasR1,
      hasR2,
      hasR3,
      hasAnyGrade,
      averageNum: c.ueesAverage,
    };
  });

  // Ordenar por promedio para recomendaciones dinámicas (de menor a mayor)
  const sortedByAvg = [...subjectsReport].sort((a, b) => a.averageNum - b.averageNum);
  const lowestSubj = sortedByAvg[0];
  const secondLowest = sortedByAvg[1] || lowestSubj;
  const highestSubj = sortedByAvg[sortedByAvg.length - 1];

  // Recopilar notas rápidas y apuntes de las tareas de la semana activa
  const taskNotesBySubject: {
    subjectName: string;
    tasksWithNotes: { name: string; note: string; completed: boolean }[];
  }[] = [];

  activeDashboard.subjects.forEach((s) => {
    const tasks = currentWeek.subjectTasks[s.id] || [];
    const withNotes = tasks
      .filter((t) => t.note && t.note.trim() !== '')
      .map((t) => ({ name: t.name, note: t.note!.trim(), completed: t.completed }));

    if (withNotes.length > 0) {
      taskNotesBySubject.push({
        subjectName: s.name,
        tasksWithNotes: withNotes,
      });
    }
  });

  // ----------------------------------------------------------------------
  // PRIORIDAD 1: Plan de estudio / Qué estudiar hoy / Para no atrasarme
  // ----------------------------------------------------------------------
  const isAskingStudyPlan =
    p.includes('estudi') ||
    p.includes('hoy') ||
    p.includes('plan') ||
    p.includes('atrasar') ||
    p.includes('prioridad') ||
    p.includes('que hago') ||
    p.includes('por donde empiezo');

  if (isAskingStudyPlan) {
    let msg = `🎯 **Plan de Estudio Estratégico para Hoy (por KALI):**\n\n`;
    msg += `He analizado tus 5 materias, tus promedios oficiales y tus pendientes de la **Semana ${currentWeek.weekNumber}**:\n\n`;

    if (lowestSubj) {
      msg += `1. ⚠️ **${lowestSubj.subject.name} (Prioridad Máxima):**\n`;
      msg += `   • **Promedio actual:** **${lowestSubj.calc.ueesAverageFormatted}**\n`;
      msg += `   • **Meta en Registro 3 (40%):** Necesitas sacar al menos **${lowestSubj.calc.neededInR3 || 'calificación sólida'}** para asegurar tu 6.0.\n`;

      // Buscar si tiene notas de tareas
      const subjNotes = taskNotesBySubject.find(
        (g) => g.subjectName.toLowerCase().includes(lowestSubj.subject.name.toLowerCase().slice(0, 4))
      );
      if (subjNotes && subjNotes.tasksWithNotes.length > 0) {
        msg += `   • **Tus notas de tareas:** `;
        const notesStr = subjNotes.tasksWithNotes.map((tn) => `*«${tn.note}»* en ${tn.name}`).join(', ');
        msg += `${notesStr}.\n`;
      }
      msg += `   👉 **Acción recomendada:** Dedica el primer bloque de **25 min de Pomodoro** a liquidar los pendientes y foros de esta materia.\n\n`;
    }

    if (secondLowest && secondLowest !== lowestSubj) {
      msg += `2. ⚠️ **${secondLowest.subject.name} (Prioridad Media):**\n`;
      msg += `   • **Promedio actual:** **${secondLowest.calc.ueesAverageFormatted}**\n`;
      msg += `   • **Meta en Registro 3 (40%):** Requiere **${secondLowest.calc.neededInR3 || '3.0'}**.\n`;
      msg += `   👉 **Acción recomendada:** Revisa las fórmulas o prácticas del laboratorio para mantener el ritmo.\n\n`;
    }

    if (highestSubj) {
      msg += `3. 👍 **${highestSubj.subject.name} (Bajo Riesgo):**\n`;
      msg += `   • Vas excelente con **${highestSubj.calc.ueesAverageFormatted}** (solo requieres ${highestSubj.calc.neededInR3 || '0.8'} en R3).\n`;
      msg += `   👉 Solo asegúrate de subir las actividades semanales.\n\n`;
    }

    msg += `💡 **En conclusión:** Si dedicas 50 minutos hoy (2 bloques Pomodoro) a tus temas más apretados, quedarás al día y sin estrés. ¿Quieres que te tome el tiempo con el temporizador Pomodoro ahora mismo?`;
    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 2: Notas Rápidas / Apuntes de tareas ("esas notas", "qué dice")
  // ----------------------------------------------------------------------
  const isAskingTaskNotes =
    p.includes('nota rapida') ||
    p.includes('notas rapidas') ||
    p.includes('apunte') ||
    p.includes('apuntes') ||
    p.includes('esas notas') ||
    p.includes('que dice') ||
    p.includes('dice las que') ||
    p.includes('las que tiene notas') ||
    p.includes('notas de las tareas') ||
    p.includes('nota de la tarea') ||
    p.includes('toidavia') ||
    p.includes('mandarla');

  if (isAskingTaskNotes) {
    if (taskNotesBySubject.length === 0) {
      return {
        text: `📝 **Notas rápidas de tus tareas:**\n\nActualmente no tienes apuntes o notas escritas en las tareas de la **Semana ${currentWeek.weekNumber}**.\n\nPuedes agregar una nota rápida tocando el icono de lápiz ✏️ al lado de cualquier tarea (ej. *"falta mandarla"*, *"Me falta uno toidavia"*).`,
        action: null,
      };
    }

    let msg = `📝 **¡Aquí están las notas rápidas y apuntes de tus tareas en la Semana ${currentWeek.weekNumber}!**\n\n`;

    taskNotesBySubject.forEach((group) => {
      msg += `* **${group.subjectName}**:\n`;
      group.tasksWithNotes.forEach((t) => {
        const icon = t.completed ? '✓' : '⏳';
        msg += `  - **${t.name}** (${icon} ${t.completed ? 'Entregada' : 'Pendiente'}): 📌 *«${t.note}»*\n`;
      });
      msg += `\n`;
    });

    msg += `💡 *Tip: Puedes editar o cambiar estas notas en cualquier momento pulsando el icono del lápiz ✏️ en la tarea.*`;
    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 3: Cuáles materias tienen notas
  // ----------------------------------------------------------------------
  const isAskingWhichHaveGrades =
    (p.includes('que') || p.includes('cuales') || p.includes('dime') || p.includes('solo')) &&
    (p.includes('tienen nota') || p.includes('tiene nota') || p.includes('tienen notas') || p.includes('con nota'));

  if (isAskingWhichHaveGrades) {
    const withGrades = subjectsReport.filter((s) => s.hasAnyGrade);
    const withoutGrades = subjectsReport.filter((s) => !s.hasAnyGrade);

    let msg = '';
    if (withGrades.length === subjectsReport.length) {
      msg += `📌 **Actualmente las 5 materias tienen notas ingresadas** en el Registro 1 y Registro 2 (el Registro 3 aún está pendiente en todas):\n\n`;
    } else {
      msg += `📌 **Materias que tienen notas ingresadas (${withGrades.length} de ${subjectsReport.length}):**\n\n`;
    }

    withGrades.forEach((item, idx) => {
      const g = item.gradeData;
      const c = item.calc;
      msg += `${idx + 1}. **${item.subject.name}**\n`;
      msg += `   • **R1:** ${g.p1 || '-'} | **R2:** ${g.p2 || '-'} | **R3:** ${g.p3 || 'pendiente'}\n`;
      msg += `   • **Promedio Oficial:** **${c.ueesAverageFormatted}** (Acumulado: ${c.accumulatedFormatted}/10.0)\n`;
      if (c.neededInR3 && !c.isPassed) {
        msg += `   • *Meta para pasar (6.0):* Requiere **${c.neededInR3}** en Registro 3.\n\n`;
      } else {
        msg += `\n`;
      }
    });

    if (withoutGrades.length > 0) {
      msg += `⚠️ **Materias sin notas registradas:**\n`;
      withoutGrades.forEach((item) => {
        msg += `• **${item.subject.name}** (Notas pendientes de publicación)\n`;
      });
      msg += `\n`;
    }

    msg += `💡 **En resumen:** En todas las materias ya tienes calificados los cómputos 1 y 2 (60% del ciclo). Solo te falta el **Registro 3 (40%)** para cerrar el semestre.`;

    if (taskNotesBySubject.length > 0) {
      msg += `\n\n📝 **Notas rápidas escritas en tus tareas:**\n`;
      taskNotesBySubject.forEach((group) => {
        msg += `* **${group.subjectName}**:\n`;
        group.tasksWithNotes.forEach((t) => {
          msg += `  - ${t.name}: 📌 *«${t.note}»*\n`;
        });
      });
    }

    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 4: Materia específica (con coincidencia estricta de palabras completas)
  // ----------------------------------------------------------------------
  const ignoreWords = new Set(['materia', 'materias', 'nota', 'notas', 'tarea', 'tareas', 'para', 'como', 'cada', 'todas', 'todo', 'mis']);
  const promptTokens = p.replace(/[^\w\sáéíóúüñ]/g, ' ').split(/\s+/).filter(Boolean);

  const matchedSubject = subjectsReport.find((s) => {
    const sNameNorm = s.subject.name.toLowerCase();
    const subjTokens = sNameNorm.split(/\s+/).filter((t) => t.length > 2 && !ignoreWords.has(t));
    return subjTokens.some((token) => promptTokens.includes(token));
  });

  if (matchedSubject && (p.includes('nota') || p.includes('como voy') || p.includes('promedio') || p.includes('docente') || p.includes('r3') || p.includes('pasar'))) {
    const s = matchedSubject.subject;
    const g = matchedSubject.gradeData;
    const c = matchedSubject.calc;

    let msg = `📘 **Detalle de ${s.name}:**\n\n`;
    msg += `* **Catedrático:** ${g.teacher || 'Catedrático UEES'}\n`;
    msg += `* **Registro 1 (30%):** ${g.p1 || 'Sin nota'}\n`;
    msg += `* **Registro 2 (30%):** ${g.p2 || 'Sin nota'}\n`;
    msg += `* **Registro 3 (40%):** ${g.p3 || 'Pendiente de evaluación'}\n`;
    if (g.repo) {
      msg += `* **Reposición:** ${g.repo}\n`;
    }
    msg += `* **Promedio Oficial UEES:** **${c.ueesAverageFormatted}** (Puntaje acumulado: ${c.accumulatedFormatted} de 10.0)\n\n`;

    if (c.isPassed) {
      msg += `🎉 **Estado:** ¡Ya alcanzaste el puntaje de aprobación (≥ 6.0)!`;
    } else if (c.neededInR3) {
      msg += `🎯 **Meta para aprobar:** Necesitas sacar al menos **${c.neededInR3}** en el Registro 3 (40%) para alcanzar la nota mínima de 6.0.`;
    }

    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 5: Consulta general de notas / calificaciones
  // ----------------------------------------------------------------------
  if (p.includes('nota') || p.includes('promedio') || p.includes('como voy') || p.includes('calificac') || p.includes('r3') || p.includes('cuanto necesito')) {
    let msg = `📊 **Estado Oficial de tus Calificaciones UEES:**\n\n`;
    subjectsReport.forEach((item) => {
      const g = item.gradeData;
      const c = item.calc;
      const icon = c.isPassed ? '🎉' : parseFloat(c.ueesAverageFormatted) >= 5.0 ? '👍' : '⚠️';
      msg += `* ${icon} **${item.subject.name}**: Promedio **${c.ueesAverageFormatted}** (R1: ${g.p1 || '-'}, R2: ${g.p2 || '-'}, R3: ${g.p3 || 'pendiente'})\n`;
      if (c.neededInR3 && !c.isPassed) {
        msg += `  ↳ *Meta para pasar con 6.0:* Necesitas **${c.neededInR3}** en Registro 3 (40%).\n`;
      }
    });

    if (highestSubj && lowestSubj) {
      msg += `\n💡 **Recomendación de KALI:** Tu materia con mejor promedio es **${highestSubj.subject.name}** (${highestSubj.calc.ueesAverageFormatted}). Tu prioridad número 1 debe ser **${lowestSubj.subject.name}** (${lowestSubj.calc.ueesAverageFormatted}), donde requieres al menos **${lowestSubj.calc.neededInR3 || 'calificación alta'}** en R3.`;
    }

    if (taskNotesBySubject.length > 0) {
      msg += `\n\n📝 **Notas rápidas anotadas en tus tareas de esta semana:**\n`;
      taskNotesBySubject.forEach((group) => {
        group.tasksWithNotes.forEach((t) => {
          msg += `* **${group.subjectName}** (${t.name}): 📌 *«${t.note}»*\n`;
        });
      });
    }

    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 6: Tareas pendientes
  // ----------------------------------------------------------------------
  if (p.includes('tarea') || p.includes('pendiente') || p.includes('semana') || p.includes('falta') || p.includes('actividad')) {
    let totalPending = 0;
    let msg = `📅 **Tareas pendientes en la Semana ${currentWeek.weekNumber} (${currentWeek.dateRange}):**\n\n`;

    activeDashboard.subjects.forEach((s) => {
      const tasks = currentWeek.subjectTasks[s.id] || [];
      const pending = tasks.filter((t) => !t.completed);
      totalPending += pending.length;
      if (pending.length > 0) {
        msg += `* **${s.name}** (${pending.length} pendiente${pending.length > 1 ? 's' : ''}):\n`;
        pending.forEach((t) => {
          msg += `  - ⏳ ${t.name}${t.note ? ` (Nota: «${t.note}»)` : ''}\n`;
        });
      }
    });

    if (totalPending === 0) {
      msg += `¡Excelente trabajo! No tienes tareas pendientes en la semana actual. 🎉`;
    } else {
      msg += `\n💪 Tienes **${totalPending} actividades** por entregar. Te recomiendo comenzar por los foros y reportes que tengan fecha más cercana.`;
    }
    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 7: Docentes / Catedráticos
  // ----------------------------------------------------------------------
  if (p.includes('profesor') || p.includes('docente') || p.includes('catedratic') || p.includes('quien da') || p.includes('quien me da')) {
    let msg = `👨‍🏫 **Catedráticos de tus Materias (UEES):**\n\n`;
    subjectsReport.forEach((item, idx) => {
      const teacher = item.gradeData.teacher || 'Catedrático asignado UEES';
      msg += `${idx + 1}. **${item.subject.name}**\n`;
      msg += `   • Docente: **${teacher}**\n`;
      msg += `   • Promedio actual: ${item.calc.ueesAverageFormatted}\n\n`;
    });
    msg += `💡 *Tip: Puedes ver el aula y horario exacto de cada docente abriendo el botón de "Horario de Clases" en la barra de herramientas.*`;
    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 8: Fórmula de cálculo de notas oficial de la UEES
  // ----------------------------------------------------------------------
  if (p.includes('formula') || p.includes('como se calcula') || p.includes('como calculan') || p.includes('porcentaj') || p.includes('cuanto vale') || p.includes('como sacar el promedio')) {
    let msg = `🧮 **Fórmula Oficial de Calificaciones UEES:**\n\n`;
    msg += `El sistema académico de la UEES evalúa el ciclo en 3 registros con la siguiente ponderación:\n\n`;
    msg += `* 📌 **Registro 1 (R1):** **30%** (0.30)\n`;
    msg += `* 📌 **Registro 2 (R2):** **30%** (0.30)\n`;
    msg += `* 📌 **Registro 3 (R3):** **40%** (0.40)\n\n`;
    msg += `📊 **Fórmula de Promedio Final:**\n`;
    msg += `\`\`\`text\n`;
    msg += `Promedio = (R1 × 0.30) + (R2 × 0.30) + (R3 × 0.40)\n`;
    msg += `\`\`\`\n\n`;
    msg += `* ✅ **Nota mínima de aprobación:** **6.0** (sobre 10.0).\n`;
    msg += `* 🔍 **Regla del portal:** Los promedios oficiales se redondean a **1 decimal**.\n`;
    msg += `* 🎯 Actualmente ya completaste R1 (30%) y R2 (30%), sumando el 60% del ciclo. El restante **40% se define en el Registro 3**.\n\n`;
    msg += `¿Quieres calcular tu nota proyectada para alguna materia en específico?`;
    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 9: Técnica Pomodoro / Hábitos de estudio
  // ----------------------------------------------------------------------
  if (p.includes('pomodoro') || p.includes('concentra') || p.includes('tecnica') || p.includes('consejo') || p.includes('habito')) {
    let msg = `⏱️ **Estrategia de Enfoque Académico con Pomodoro:**\n\n`;
    msg += `Para maximizar tu retención sin agotarte, te sugiero la técnica de bloques de alta intensidad:\n\n`;
    msg += `1. 🍅 **Bloque 1 (25 min):** Estudia la materia más retadora (${lowestSubj?.subject.name || 'Matemática II'}). Cierra redes sociales y teléfono.\n`;
    msg += `2. ☕ **Descanso corto (5 min):** Estírate y toma agua.\n`;
    msg += `3. 🍅 **Bloque 2 (25 min):** Resuelve los ejercicios pendientes o avanza tus reportes de laboratorio.\n`;
    msg += `4. 🌟 **Descanso largo (15 min):** Desconecta la mente.\n\n`;
    msg += `💡 En tu barra superior tienes el botón del **Temporizador Pomodoro** listo para usar. ¿Te gustaría activarlo ahora?`;
    return { text: msg, action: null };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 10: Crear una tarea
  // ----------------------------------------------------------------------
  if (p.includes('agrega') || p.includes('crea') || p.includes('anota') || p.includes('recordatorio')) {
    let matchedSubj = activeDashboard.subjects.find((s) =>
      p.includes(s.name.toLowerCase().slice(0, 5))
    );

    const taskNameCandidate = prompt
      .replace(/agrega(r)?/i, '')
      .replace(/crea(r)?/i, '')
      .replace(/anota(r)?/i, '')
      .replace(/tarea/i, '')
      .replace(/que/i, '')
      .trim();

    const targetSubj = matchedSubj || activeDashboard.subjects[0];
    const finalTaskName = taskNameCandidate || 'Nueva actividad académica';

    return {
      text: `Entendido. He creado la tarea **"${finalTaskName}"** para la materia **${targetSubj.name}** en la Semana ${currentWeek.weekNumber}. ✓`,
      action: {
        action: 'create_task',
        subjectName: targetSubj.name,
        taskName: finalTaskName,
      },
    };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 11: Saludo / Identidad
  // ----------------------------------------------------------------------
  if (p.includes('hola') || p.includes('quien eres') || p.includes('como te llamas') || p.includes('kali')) {
    return {
      text: `¡Hola ${context.studentName}! Soy **KALI**, tu Copiloto Académica de la UEES. 🎓\n\nPuedo ayudarte a:\n• 🎯 Armar tu plan de estudio diario para no atrasarte.\n• 📊 Consultar tus notas oficiales y cuánto necesitas en Registro 3.\n• 📝 Revisar los apuntes y notas rápidas que escribes en tus tareas.\n• 📋 Organizar las actividades de la Semana ${currentWeek.weekNumber}.\n• 👨‍🏫 Ver tus docentes y horarios de materias.\n• 🧮 Explicarte la fórmula de cálculo de notas (30%/30%/40%).\n• ✍️ Crear o marcar tareas automáticamente.\n\n¿Qué revisamos hoy?`,
      action: null,
    };
  }

  // ----------------------------------------------------------------------
  // PRIORIDAD 12: Operaciones matemáticas directas (ej. "cuanto es 3 + 5", "calcula 15 * 8")
  // ----------------------------------------------------------------------
  const cleanMath = p
    .replace(/cuanto es/gi, '')
    .replace(/calcula/gi, '')
    .replace(/resultado de/gi, '')
    .replace(/cuanto da/gi, '')
    .replace(/x/gi, '*')
    .replace(/,/g, '.')
    .replace(/\?/g, '')
    .trim();

  if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(cleanMath) && /[\+\-\*\/]/.test(cleanMath)) {
    try {
      const calcResult = Function(`'use strict'; return (${cleanMath})`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult)) {
        return {
          text: `🧮 **Resultado Matemático:**\n\n\`${cleanMath.replace(/\*/g, '×')} = ${calcResult}\``,
          action: null,
        };
      }
    } catch {}
  }

  // Respuesta general
  return {
    text: `¡Hola ${context.studentName}! Soy **KALI**, tu Copiloto IA de la UEES.\n\nPuedes preguntarme:\n• *"Analiza mis materias y notas y dime qué debería estudiar hoy para no atrasarme"*\n• *"¿Qué dicen las notas de mis tareas?"*\n• *"¿Cómo se calcula el promedio en la UEES?"*\n• *"¿Quiénes son mis catedráticos?"*\n• *"¿Cuánto necesito en R3 para pasar Matemática II?"*\n• *"Agrega la tarea de laboratorio de Física"*\n\n*(Nota: Con tu API Key de Google Gemini conectada, también puedo resolver dudas teóricas de código, fórmulas de física o ejercicios paso a paso).*`,
    action: null,
  };
}

/**
 * Envía el mensaje al agente (usando Gemini 2.0 / 1.5 vía REST o fallback inteligente de KALI)
 */
export async function sendAgentMessage(
  userText: string,
  chatHistory: ChatMessage[],
  context: AgentContextData
): Promise<{ text: string; action: any | null }> {
  const apiKey = getGeminiApiKey();

  // Si no hay API Key, usar motor local inteligente de KALI
  if (!apiKey) {
    return generateLocalFallbackResponse(userText, context);
  }

  try {
    const systemInstruction = buildSystemInstruction(context);

    // Sanitizar historial garantizando estricta alternancia de roles (user -> model -> user)
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    const relevantHistory = chatHistory
      .filter((m) => m.sender === 'user' || m.sender === 'agent')
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

    // Descartar mensajes de bienvenida o reinicio del bot antes del primer turno de usuario
    const firstUserIdx = relevantHistory.findIndex((m) => m.role === 'user');
    const validHistory = firstUserIdx >= 0 ? relevantHistory.slice(firstUserIdx) : [];

    for (const item of validHistory) {
      if (contents.length === 0) {
        contents.push({ role: item.role, parts: [{ text: item.text }] });
      } else {
        const last = contents[contents.length - 1];
        if (last.role === item.role) {
          last.parts.push({ text: item.text });
        } else {
          contents.push({ role: item.role, parts: [{ text: item.text }] });
        }
      }
    }

    // Agregar el mensaje actual del usuario garantizando turno 'user'
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts.push({ text: userText });
    } else {
      contents.push({ role: 'user', parts: [{ text: userText }] });
    }

    // Petición REST directa a Google Generative AI
    const makeRequest = async (model: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    };

    let result = await makeRequest('gemini-2.0-flash');

    // Si 2.0 arroja 404, reintentar con gemini-1.5-flash
    if (!result.ok && result.status === 404) {
      console.warn('Reintentando con gemini-1.5-flash');
      result = await makeRequest('gemini-1.5-flash');
    }

    if (result.ok) {
      const responseText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (responseText.trim()) {
        return extractAgentAction(responseText);
      }
    }

    // Si Google reportó un error específico (clave inválida, cuota, etc.)
    if (result.data?.error?.message) {
      const rawError = result.data.error.message;
      console.warn('Google Gemini API Error:', rawError);

      let errorBanner = '';
      if (rawError.includes('API key not valid') || rawError.includes('API_KEY_INVALID')) {
        errorBanner = `⚠️ **Aviso de Clave:** Google rechazó tu clave (*API key no válida o mal copiada*). Por favor verifícala en Google AI Studio tocando el botón 🔑.\n\n*(Respondiendo con el motor local de KALI:)*\n\n`;
      } else if (rawError.includes('quota') || result.data.error.status === 'RESOURCE_EXHAUSTED') {
        errorBanner = `⚠️ **Aviso de Cuota:** Has alcanzado el límite de cuota gratuita en tu cuenta de Google Gemini.\n\n*(Respondiendo con el motor local de KALI:)*\n\n`;
      } else {
        errorBanner = `⚠️ **Aviso de Google Gemini:** ${rawError}\n\n*(Respondiendo con el motor local de KALI:)*\n\n`;
      }

      const fallback = generateLocalFallbackResponse(userText, context);
      return {
        text: `${errorBanner}${fallback.text}`,
        action: fallback.action,
      };
    }

    return generateLocalFallbackResponse(userText, context);
  } catch (error: any) {
    console.warn('Fallo en conexión Gemini API, recurriendo a motor local KALI:', error);
    const fallback = generateLocalFallbackResponse(userText, context);
    return {
      text: fallback.text,
      action: fallback.action,
    };
  }
}
