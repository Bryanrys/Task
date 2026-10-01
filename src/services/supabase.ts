import { createClient } from '@supabase/supabase-js';
import { Dashboard } from '../types';
import { INITIAL_DASHBOARDS } from '../constants/initialData';

const SUPABASE_URL = 'https://wnrrypxwrfmwaiffhlzo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JdomtReek_Bqy44p6HKj_Q_jvuJLFtJ';
export const USER_ID_PRIVADO = 'user_master_lixx_00';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface ExtraSyncData {
  universityLinks?: any[];
  gradesTracker?: Record<string, any>;
  classSchedule?: any[];
  notificationSettings?: any;
}

/**
 * Builds legacy HTML compatibility format from Dashboard object
 */
function buildLegacyFormat(dashboards: Dashboard[]) {
  const ueesDash = dashboards.find((d) => d.id === 'dash-uees') || dashboards[0];
  if (!ueesDash) return null;

  const activeWeek = ueesDash.weeks.find((w) => w.id === ueesDash.activeWeekId) || ueesDash.weeks[ueesDash.weeks.length - 1];
  const activeWeekNum = activeWeek ? activeWeek.weekNumber : 1;

  const semanasObj: Record<string, { entregas: Record<string, boolean>; completada: boolean }> = {};

  ueesDash.weeks.forEach((w) => {
    const semLabel = `Semana ${w.weekNumber}`;
    const entregas: Record<string, boolean> = {};

    ueesDash.subjects.forEach((s) => {
      const taskList = w.subjectTasks[s.id] || [];
      taskList.forEach((t) => {
        entregas[`${s.name}_${t.name}`] = t.completed;
      });
    });

    semanasObj[semLabel] = {
      entregas,
      completada: w.status === 'COMPLETADO',
    };
  });

  return {
    '[ UEES ]': {
      semanas: semanasObj,
      materias: ueesDash.subjects.map((s) => s.name),
      actividades: ['Foro entregado', 'Tarea entregada'],
      semanaActiva: `Semana ${activeWeekNum}`,
    },
  };
}

/**
 * Converts legacy HTML data format into modern Dashboard[] structure
 */
export function convertLegacyToDashboards(legacyData: any): Dashboard[] {
  const base = JSON.parse(JSON.stringify(INITIAL_DASHBOARDS)) as Dashboard[];
  const ueesDash = base[0];

  const ueesRaw = legacyData?.['[ UEES ]'] || legacyData?.['UEES'] || legacyData;
  if (!ueesRaw || !ueesRaw.semanas) return base;

  const semanas = ueesRaw.semanas;

  ueesDash.weeks.forEach((w) => {
    const semKey = `Semana ${w.weekNumber}`;
    const oldSem = semanas[semKey];
    if (oldSem) {
      if (oldSem.completada) {
        w.status = 'COMPLETADO';
      }
      const entregas = oldSem.entregas || {};
      ueesDash.subjects.forEach((s, sIdx) => {
        const tasks = w.subjectTasks[s.id] || [];
        tasks.forEach((t) => {
          const keyByName = `${s.name}_${t.name}`;
          const keyByIdx = `${sIdx}_${t.name}`;
          if (entregas[keyByName] !== undefined) {
            t.completed = !!entregas[keyByName];
          } else if (entregas[keyByIdx] !== undefined) {
            t.completed = !!entregas[keyByIdx];
          }
        });
      });
    }
  });

  if (ueesRaw.semanaActiva) {
    const num = parseInt(ueesRaw.semanaActiva.replace(/\D/g, ''), 10);
    if (num) {
      const target = ueesDash.weeks.find((w) => w.weekNumber === num);
      if (target) {
        ueesDash.activeWeekId = target.id;
      }
    }
  }

  return [ueesDash];
}

/**
 * Saves dashboards and all application settings (links, grades, schedules) to Supabase
 */
export async function cloudSave(
  keyName: string,
  dataObject: any,
  extra?: ExtraSyncData
): Promise<boolean> {
  try {
    const fechaActual = new Date().toISOString();
    const legacyPart = Array.isArray(dataObject) ? buildLegacyFormat(dataObject) : null;

    // Read local storage fallbacks if extra is not passed
    let links = extra?.universityLinks;
    let grades = extra?.gradesTracker;
    let schedule = extra?.classSchedule;
    let notifs = extra?.notificationSettings;

    if (typeof localStorage !== 'undefined') {
      try {
        if (!links) links = JSON.parse(localStorage.getItem('academic_university_links_v1') || 'null');
        if (!grades) grades = JSON.parse(localStorage.getItem('academic_grades_tracker_v1') || 'null');
        if (!schedule) schedule = JSON.parse(localStorage.getItem('academic_class_schedule_v1') || 'null');
        if (!notifs) notifs = JSON.parse(localStorage.getItem('academic_notifications_settings_v1') || 'null');
      } catch {}
    }

    const paqueteDatos: Record<string, any> = {
      data: dataObject,
      universityLinks: links || null,
      gradesTracker: grades || null,
      classSchedule: schedule || null,
      notificationSettings: notifs || null,
      fechaActualizacion: fechaActual,
    };

    if (legacyPart && legacyPart['[ UEES ]']) {
      paqueteDatos['[ UEES ]'] = legacyPart['[ UEES ]'];
    }

    // 1. Save main package under private user key
    await supabase.from('data_user_bro').upsert(
      { key: `${USER_ID_PRIVADO}_${keyName}`, value: paqueteDatos },
      { onConflict: 'key' }
    );

    // 2. Dual-save to legacy key (coleccion_dashboards)
    await supabase.from('data_user_bro').upsert(
      { key: keyName, value: paqueteDatos },
      { onConflict: 'key' }
    );

    // 3. Dedicated sub-keys for extra resilience
    if (links) {
      await supabase.from('data_user_bro').upsert(
        { key: `${USER_ID_PRIVADO}_university_links`, value: links },
        { onConflict: 'key' }
      );
    }
    if (grades) {
      await supabase.from('data_user_bro').upsert(
        { key: `${USER_ID_PRIVADO}_grades_tracker`, value: grades },
        { onConflict: 'key' }
      );
    }
    if (schedule) {
      await supabase.from('data_user_bro').upsert(
        { key: `${USER_ID_PRIVADO}_class_schedule`, value: schedule },
        { onConflict: 'key' }
      );
    }

    return true;
  } catch (e) {
    console.error('Excepción al guardar en Supabase:', e);
    return false;
  }
}

/**
 * Loads dashboards and all related modules (links, grades, schedules) from Supabase
 */
export async function cloudLoad(keyName: string): Promise<any | null> {
  try {
    let resultValue: any = null;

    // 1. Try with user prefix
    const { data: data1 } = await supabase
      .from('data_user_bro')
      .select('value')
      .eq('key', `${USER_ID_PRIVADO}_${keyName}`)
      .single();

    if (data1?.value) {
      resultValue = data1.value;
    } else {
      // 2. Try direct key without prefix (used by old HTML)
      const { data: data2 } = await supabase
        .from('data_user_bro')
        .select('value')
        .eq('key', keyName)
        .single();
      if (data2?.value) {
        resultValue = data2.value;
      }
    }

    if (!resultValue) return null;

    // Normalize result structure
    let outData = resultValue.data;
    if (!outData && (resultValue['[ UEES ]'] || resultValue.semanas)) {
      outData = convertLegacyToDashboards(resultValue);
    } else if (!outData && Array.isArray(resultValue)) {
      outData = resultValue;
    }

    // Try dedicated sub-keys if not present in main object
    let universityLinks = resultValue.universityLinks;
    let gradesTracker = resultValue.gradesTracker;
    let classSchedule = resultValue.classSchedule;

    if (!universityLinks) {
      try {
        const { data: linkRes } = await supabase
          .from('data_user_bro')
          .select('value')
          .eq('key', `${USER_ID_PRIVADO}_university_links`)
          .single();
        if (linkRes?.value) universityLinks = linkRes.value;
      } catch {}
    }

    if (!gradesTracker) {
      try {
        const { data: gradesRes } = await supabase
          .from('data_user_bro')
          .select('value')
          .eq('key', `${USER_ID_PRIVADO}_grades_tracker`)
          .single();
        if (gradesRes?.value) gradesTracker = gradesRes.value;
      } catch {}
    }

    if (!classSchedule) {
      try {
        const { data: schedRes } = await supabase
          .from('data_user_bro')
          .select('value')
          .eq('key', `${USER_ID_PRIVADO}_class_schedule`)
          .single();
        if (schedRes?.value) classSchedule = schedRes.value;
      } catch {}
    }

    return {
      data: outData,
      universityLinks: universityLinks || null,
      gradesTracker: gradesTracker || null,
      classSchedule: classSchedule || null,
      notificationSettings: resultValue.notificationSettings || null,
    };
  } catch (e) {
    console.warn('Excepción al cargar de Supabase:', e);
    return null;
  }
}
