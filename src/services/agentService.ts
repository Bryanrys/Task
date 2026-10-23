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

  // Resumen de tareas de la semana activa (incluyendo notas/apuntes rápidos)
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

TAREAS DE LA SEMANA ACTUAL (${currentWeek.dateRange}):
${tasksSummary}

REGLAS DE CONDUCTA DE KALI:
1. Conoces exactamente las 5 materias de Bryan (Bases de Datos I, Comunicación y Redacción, Matemática II, Física II, Programación II) y el cálculo de notas oficial.
2. Si el estudiante te pregunta cuáles materias tienen notas, responde directamente cuáles tienen registros ingresados y cuáles no.
3. Si el estudiante te pide agregar o crear una tarea, o marcar una tarea como completada, responde de forma conversacional y añade al FINAL de tu respuesta un bloque JSON con la acción estructurada para que la app la ejecute automáticamente:
\`\`\`action
{"action": "create_task", "subjectName": "Nombre Materia", "taskName": "Nombre de la Tarea"}
\`\`\`
O para completar:
\`\`\`action
{"action": "complete_task", "subjectName": "Nombre Materia", "taskName": "Nombre de la Tarea"}
\`\`\`
4. Si el estudiante te pide explicaciones teóricas o prácticas de sus materias (SQL, programación orientada a objetos, cálculo, física o redacción), explícaselo con ejemplos claros y concisos.
5. Mantén tus respuestas directas al punto y fáciles de leer en pantalla de smartphone o PC.`;
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

  // Ordenar por promedio para recomendaciones dinámicas
  const sortedByAvg = [...subjectsReport].sort((a, b) => a.averageNum - b.averageNum);
  const lowestSubj = sortedByAvg[0];
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

  // Detección si se refiere a notas rápidas / apuntes de tareas:
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
    p.includes('mandarla') ||
    (p.includes('nota') && (p.includes('foro') || p.includes('entregar') || p.includes('mandar')));

  if (isAskingTaskNotes) {
    if (taskNotesBySubject.length === 0) {
      return {
        text: `📝 **Notas rápidas de tus tareas:**\n\nActualmente no tienes apuntes o notas escritas en las tareas de la **Semana ${currentWeek.weekNumber}**.\n\nPuedes agregar una nota rápida tocando el icono de lápiz ✏️ al lado de cualquier tarea (ej. *"falta mandarla"*, *"Me falta uno toidavia"*).`,
        action: null,
      };
    }

    let msg = `📝 **¡Ah, te referías a las notas rápidas y apuntes de tus tareas!** 😂\n\nAquí tienes lo que dice cada una en la **Semana ${currentWeek.weekNumber}**:\n\n`;

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

  // 1. Pregunta específica: "¿Qué materias tienen notas?" o "dime las que tienen notas" o "¿cuáles tienen notas?"
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

  // 2. Pregunta por una materia específica (ej: "cómo voy en matemática", "notas de física", "programación", etc.)
  const matchedSubject = subjectsReport.find((s) => {
    const sName = s.subject.name.toLowerCase();
    const words = sName.split(' ');
    return words.some((w) => w.length > 3 && p.includes(w));
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

  // 3. Consulta general de notas / promedios / calificaciones
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
        msg += `* **${group.subjectName}**:\n`;
        group.tasksWithNotes.forEach((t) => {
          msg += `  - ${t.name}: 📌 *«${t.note}»*\n`;
        });
      });
    }

    return { text: msg, action: null };
  }

  // 4. Consulta de tareas pendientes de la semana
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
          msg += `  - ⏳ ${t.name}\n`;
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

  // 5. Crear una tarea
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

  // 6. Qué estudiar hoy
  if (p.includes('estudio') || p.includes('hoy') || p.includes('plan')) {
    let msg = `🎯 **Plan de Estudio Recomendado para Hoy (por KALI):**\n\n`;
    if (lowestSubj) {
      msg += `1. **${lowestSubj.subject.name} (Prioridad Alta):** Es la materia con promedio de **${lowestSubj.calc.ueesAverageFormatted}**. Dedica 1 sesión de 25 min de Pomodoro a repasar ejercicios del Registro 3 para asegurar tu meta de **${lowestSubj.calc.neededInR3 || '6.0'}**.\n`;
    }
    const secondLowest = sortedByAvg[1] || lowestSubj;
    if (secondLowest && secondLowest !== lowestSubj) {
      msg += `2. **${secondLowest.subject.name} (Prioridad Media):** Promedio de **${secondLowest.calc.ueesAverageFormatted}**. Revisa tus entregas y reportes pendientes.\n`;
    }
    if (highestSubj) {
      msg += `3. **${highestSubj.subject.name}:** Vas excelente con **${highestSubj.calc.ueesAverageFormatted}**. Solo mantén las tareas al día.\n\n`;
    }
    msg += `¿Quieres que iniciemos una sesión de Pomodoro de 25 minutos para empezar?`;
    return { text: msg, action: null };
  }

  // 7. Saludo / Identidad
  if (p.includes('hola') || p.includes('quien eres') || p.includes('como te llamas') || p.includes('kali')) {
    return {
      text: `¡Hola ${context.studentName}! Soy **KALI**, tu Copiloto Académica de la UEES. 🎓\n\nPuedo ayudarte a:\n• 📊 Consultar qué materias tienen notas y cuánto necesitas en Registro 3.\n• 📋 Revisar tus actividades y tareas de la Semana ${currentWeek.weekNumber}.\n• ✍️ Crear o marcar tareas automáticamente.\n• 🎯 Guiarte con un plan de estudio diario.\n\n¿En qué te puedo apoyar ahora mismo?`,
      action: null,
    };
  }

  // Respuesta general
  return {
    text: `¡Hola ${context.studentName}! Soy **KALI**, tu Copiloto IA de la UEES.\n\nPuedes preguntarme:\n• *"¿Qué materias tienen notas?"*\n• *"¿Cuánto necesito en R3 para pasar [Materia]?"*\n• *"¿Qué tareas tengo pendientes esta semana?"*\n• *"Agrega la tarea de laboratorio de Física"*\n\n*(Nota: Si deseas razonamiento libre y explicaciones teóricas avanzadas de tus materias con red neuronal en la nube, puedes ingresar tu API Key gratuita de Google Gemini en el botón 🔑).*`,
    action: null,
  };
}

/**
 * Envía el mensaje al agente (usando Gemini API o fallback inteligente de KALI)
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
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(context);

    // Formatear historial reciente (últimos 8 mensajes)
    const contents: any[] = [];

    // Prompt del sistema inicial
    contents.push({
      role: 'user',
      parts: [{ text: `[INSTRUCCIÓN DE SISTEMA Y CONTEXTO ACADÉMICO]\n${systemInstruction}` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Entendido. Soy KALI, conozco perfectamente a Bryan, sus 5 materias de la UEES, sus notas y tareas actuales. ¿En qué te puedo ayudar hoy?' }],
    });

    // Historial
    chatHistory.slice(-6).forEach((msg) => {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    });

    // Nuevo mensaje
    contents.push({
      role: 'user',
      parts: [{ text: userText }],
    });

    // Llamada con modelo rápido y estable (gemini-2.5-flash)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const responseText = response.text || '';
    if (!responseText) {
      return generateLocalFallbackResponse(userText, context);
    }

    return extractAgentAction(responseText);
  } catch (error: any) {
    console.warn('Fallo en conexión Gemini API, recurriendo a motor local KALI:', error);
    return generateLocalFallbackResponse(userText, context);
  }
}
