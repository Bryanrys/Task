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

  // Resumen de tareas de la semana activa
  const tasksSummary = activeDashboard.subjects
    .map((s) => {
      const tasks = currentWeek.subjectTasks[s.id] || [];
      const pending = tasks.filter((t) => !t.completed).map((t) => t.name);
      const completed = tasks.filter((t) => t.completed).map((t) => t.name);
      return `- ${s.name}:
  * Pendientes (${pending.length}): ${pending.join(', ') || 'Ninguna pendiente'}
  * Completadas (${completed.length}): ${completed.join(', ') || 'Ninguna completada'}`;
    })
    .join('\n');

  return `Eres "Apolo", el Copiloto y Agente de Inteligencia Artificial Académica de la Universidad Evangélica de El Salvador (UEES) diseñado para asistir a ${studentName}.
Hablas siempre en español con tono empático, ágil, altamente estructurado, motivador y profesional.

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

REGLAS DE CONDUCTA DEL AGENTE:
1. Conoces exactamente las 5 materias de Bryan (Bases de Datos I, Comunicación y Redacción, Matemática II, Física II, Programación II) y el cálculo de notas oficial.
2. Si el estudiante te pide agregar o crear una tarea, o marcar una tarea como completada, o cambiar algo, responde de forma conversacional y añade al FINAL de tu respuesta un bloque JSON con la acción estructurada para que la app la ejecute automáticamente:
\`\`\`action
{"action": "create_task", "subjectName": "Nombre Materia", "taskName": "Nombre de la Tarea"}
\`\`\`
O para completar:
\`\`\`action
{"action": "complete_task", "subjectName": "Nombre Materia", "taskName": "Nombre de la Tarea"}
\`\`\`
3. Si el estudiante te pide explicaciones teóricas o prácticas de sus materias (SQL, programación orientada a objetos, cálculo, física o redacción), explícaselo con ejemplos claros y concisos.
4. Mantén tus respuestas directas al punto y fáciles de leer en pantalla de smartphone o PC.`;
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
 * Motor de Fallback inteligente (offline o sin API Key)
 */
export function generateLocalFallbackResponse(
  prompt: string,
  context: AgentContextData
): { text: string; action: any | null } {
  const p = prompt.toLowerCase();
  const { activeDashboard, currentWeek, gradesData } = context;

  // 1. Consulta de cómo va en las materias / notas
  if (p.includes('nota') || p.includes('promedio') || p.includes('como voy') || p.includes('calificac')) {
    let msg = `📊 **Estado Oficial de tus Calificaciones UEES:**\n\n`;
    activeDashboard.subjects.forEach((s) => {
      const g = findGradeDataForSubject(s.id, s.name, gradesData);
      const c = calculateUeesGrade(g);
      const icon = c.isPassed ? '🎉' : parseFloat(c.ueesAverageFormatted) >= 5.0 ? '👍' : '⚠️';
      msg += `* ${icon} **${s.name}**: Promedio **${c.ueesAverageFormatted}** (R1: ${g.p1 || '-'}, R2: ${g.p2 || '-'}, R3: ${g.p3 || 'pendiente'})\n`;
      if (c.neededInR3 && !c.isPassed) {
        msg += `  ↳ *Meta para pasar con 6.0:* Necesitas **${c.neededInR3}** en Registro 3 (40%).\n`;
      }
    });

    msg += `\n💡 **Recomendación estratégica:** En **Programación II** (5.6) y **Bases de Datos I** (5.5) estás prácticamente aprobado. Tu prioridad número 1 debe ser **Matemática II** (4.6), donde requieres al menos 3.49 en R3.`;
    return { text: msg, action: null };
  }

  // 2. Consulta de tareas pendientes
  if (p.includes('tarea') || p.includes('pendiente') || p.includes('semana') || p.includes('falta')) {
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

  // 3. Crear una tarea
  if (p.includes('agrega') || p.includes('crea') || p.includes('anota') || p.includes('recordatorio')) {
    // Buscar si mencionó alguna materia
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

  // 4. Qué estudiar hoy
  if (p.includes('estudio') || p.includes('hoy') || p.includes('plan')) {
    return {
      text: `🎯 **Plan de Estudio Recomendado para Hoy:**\n\n1. **Matemática II (Prioridad Alta):** Es la materia con promedio de 4.6. Dedica 1 sesión de 25 min de Pomodoro a repasar ejercicios clave del tercer cómputo.\n2. **Física II (Prioridad Media):** Promedio de 4.8. Revisa los conceptos del laboratorio actual.\n3. **Bases de Datos / Programación:** Vas excelente con 5.5 y 5.6. Solo mantén la entrega de tareas al día.\n\n¿Quieres que configuremos un temporizador Pomodoro para empezar ahora?`,
      action: null,
    };
  }

  // Respuesta general con invitación a conectar Gemini
  return {
    text: `¡Hola ${context.studentName}! Soy tu Copiloto IA de la UEES. Puedo ayudarte a:
- 📊 Analizar tus notas oficiales y calcular cuánto necesitas en Registro 3.
- 📋 Organizar y consultar tus tareas de la Semana ${currentWeek.weekNumber}.
- ✍️ Crear actividades directamente hablándome.
- 💡 Resolver dudas de tus 5 materias.

*(Nota: Para respuestas avanzadas de razonamiento libre con red neuronal en vivo, puedes ingresar tu API Key gratuita de Google Gemini en el botón de ajustes ⚙️ arriba a la derecha).*`,
    action: null,
  };
}

/**
 * Envía el mensaje al agente (usando Gemini API o fallback inteligente)
 */
export async function sendAgentMessage(
  userText: string,
  chatHistory: ChatMessage[],
  context: AgentContextData
): Promise<{ text: string; action: any | null }> {
  const apiKey = getGeminiApiKey();

  // Si no hay API Key, usar motor local inteligente
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
      parts: [{ text: 'Entendido. Conozco perfectamente a Bryan, sus 5 materias de la UEES, sus notas y tareas actuales. ¿En qué te puedo ayudar hoy?' }],
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
    console.warn('Fallo en conexión Gemini API, recurriendo a motor local:', error);
    // Si la API falla (ej. red caída o clave inválida), el fallback toma el control suavemente
    return generateLocalFallbackResponse(userText, context);
  }
}
