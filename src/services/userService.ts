/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de Autenticación, Registro y Control de Roles de Usuario
 * UEES Academic Dashboard
 */

import { Dashboard, SubjectItem, WeekItem, TaskItem } from '../types';
import { computeWeekRangeFromDate } from '../utils/dateRange';
import { supabase } from './supabase';

export interface RegisteredUser {
  username: string;
  displayName: string;
  password: string;
  role: 'admin' | 'user';
  registeredAt: string;
}

export const USERS_STORAGE_KEY = 'uees_registered_users_v2';
export const AUTH_TOKEN_KEY = 'uees_academic_auth_v1';
export const LOGGED_USER_KEY = 'uees_logged_user';
export const USER_ROLE_KEY = 'uees_user_role';
export const ACTIVE_USERNAME_KEY = 'uees_active_username';
export const NEW_USER_PENDING_WIZARD_KEY = 'uees_pending_wizard';

/**
 * Obtiene la lista de usuarios registrados en el dispositivo
 */
export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Sincroniza una cuenta de usuario hacia la base de datos de Supabase
 */
export async function syncUserAccountToCloud(user: RegisteredUser): Promise<boolean> {
  try {
    const { error } = await supabase.from('data_user_bro').upsert(
      {
        key: `uees_user_acc_${user.username.toLowerCase()}`,
        value: {
          username: user.username.toLowerCase(),
          displayName: user.displayName,
          password: user.password,
          role: user.role,
          registeredAt: user.registeredAt,
        },
      },
      { onConflict: 'key' }
    );
    return !error;
  } catch (e) {
    console.warn('Error sincronizando cuenta en Supabase:', e);
    return false;
  }
}

/**
 * Consulta y recupera una cuenta de usuario desde Supabase
 */
export async function syncUserAccountFromCloud(rawUsername: string): Promise<RegisteredUser | null> {
  const u = rawUsername.trim().toLowerCase();
  if (!u || u === 'admin' || u === 'uees') return null;

  try {
    const { data, error } = await supabase
      .from('data_user_bro')
      .select('value')
      .eq('key', `uees_user_acc_${u}`)
      .maybeSingle();

    if (error || !data || !data.value) {
      return null;
    }
    return data.value as RegisteredUser;
  } catch (e) {
    console.warn('Error consultando cuenta en Supabase:', e);
    return null;
  }
}

/**
 * Guarda el dashboard personal de un estudiante en Supabase de forma privada
 */
export async function syncUserDashboardToCloud(username: string, dashboards: Dashboard[]): Promise<boolean> {
  const u = (username || '').trim().toLowerCase();
  if (!u || u === 'admin' || u === 'uees') return false;

  try {
    const { error } = await supabase.from('data_user_bro').upsert(
      {
        key: `uees_user_dash_${u}`,
        value: dashboards,
      },
      { onConflict: 'key' }
    );
    return !error;
  } catch (e) {
    console.warn('Error guardando dashboard personal en Supabase:', e);
    return false;
  }
}

/**
 * Carga el dashboard personal de un estudiante desde Supabase
 */
export async function syncUserDashboardFromCloud(username: string): Promise<Dashboard[] | null> {
  const u = (username || '').trim().toLowerCase();
  if (!u || u === 'admin' || u === 'uees') return null;

  try {
    const { data, error } = await supabase
      .from('data_user_bro')
      .select('value')
      .eq('key', `uees_user_dash_${u}`)
      .maybeSingle();

    if (error || !data || !data.value || !Array.isArray(data.value)) {
      return null;
    }
    return data.value as Dashboard[];
  } catch (e) {
    console.warn('Error recuperando dashboard personal de Supabase:', e);
    return null;
  }
}

/**
 * Registra un nuevo estudiante/usuario en el sistema local y en la nube de Supabase
 */
export async function registerNewUser(
  rawUsername: string,
  rawDisplayName: string,
  rawPassword: string
): Promise<{ success: boolean; error?: string; user?: RegisteredUser }> {
  const username = rawUsername.trim().toLowerCase();
  const displayName = rawDisplayName.trim() || rawUsername.trim();
  const password = rawPassword.trim();

  // Validaciones de formato
  if (!username) {
    return { success: false, error: 'Por favor ingresa un nombre de usuario.' };
  }

  if (username.length < 3) {
    return { success: false, error: 'El usuario debe tener al menos 3 caracteres.' };
  }

  if (!/^[a-z0-9_.-]+$/.test(username)) {
    return { success: false, error: 'El usuario solo puede contener letras, números, puntos o guiones.' };
  }

  // Nombres de usuario reservados para el Administrador
  const reserved = ['admin', 'uees', 'root', 'administrator', 'administrador'];
  if (reserved.includes(username)) {
    return {
      success: false,
      error: 'Este nombre de usuario está reservado para la administración del sistema.',
    };
  }

  if (!displayName) {
    return { success: false, error: 'Por favor ingresa tu nombre o apodo.' };
  }

  if (!password || password.length < 2) {
    return { success: false, error: 'La contraseña debe contener al menos 2 caracteres.' };
  }

  // 1. Verificar si ya existe en almacenamiento local
  const existingUsers = getRegisteredUsers();
  const existsLocal = existingUsers.some((u) => u.username === username);
  if (existsLocal) {
    return {
      success: false,
      error: `El usuario "${username}" ya existe en este dispositivo. Inicia sesión o elige otro nombre.`,
    };
  }

  // 2. Verificar si ya existe en la nube (Supabase)
  const existsCloud = await syncUserAccountFromCloud(username);
  if (existsCloud) {
    // Si ya existe en la nube, guardarlo localmente para conveniencia y pedirle iniciar sesión
    try {
      existingUsers.push(existsCloud);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
    } catch {}
    return {
      success: false,
      error: `El usuario "${username}" ya está registrado en la nube. Inicia sesión con tu contraseña.`,
    };
  }

  const newUser: RegisteredUser = {
    username,
    displayName,
    password,
    role: 'user',
    registeredAt: new Date().toISOString(),
  };

  try {
    existingUsers.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));

    // Establecer sesión activa
    localStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
    localStorage.setItem(LOGGED_USER_KEY, displayName);
    localStorage.setItem(ACTIVE_USERNAME_KEY, username);
    localStorage.setItem(USER_ROLE_KEY, 'user');
    localStorage.setItem(NEW_USER_PENDING_WIZARD_KEY, 'true');

    // Sincronizar cuenta a Supabase en la nube
    await syncUserAccountToCloud(newUser);

    // Inicializar y guardar plantilla de dashboard tanto local como en la nube
    const initialDash = createInitialDashboardForUser(username, displayName);
    const storageKey = getUserDashboardStorageKey(username, 'user');
    try {
      localStorage.setItem(storageKey, JSON.stringify([initialDash]));
    } catch {}
    await syncUserDashboardToCloud(username, [initialDash]);

    return { success: true, user: newUser };
  } catch (e) {
    return { success: false, error: 'No se pudo guardar el registro en el almacenamiento local.' };
  }
}

/**
 * Autentica un usuario existente (Admin o Estudiante registrado, compatible celular <-> web)
 */
export async function authenticateUser(
  rawUsername: string,
  rawPassword: string
): Promise<{
  success: boolean;
  error?: string;
  user?: { username: string; displayName: string; role: 'admin' | 'user'; isNew?: boolean };
}> {
  const u = rawUsername.trim().toLowerCase();
  const p = rawPassword.trim();

  if (!u) {
    return { success: false, error: 'Por favor ingresa tu usuario.' };
  }
  if (!p) {
    return { success: false, error: 'Por favor ingresa tu contraseña.' };
  }

  // 1. Verificación de credenciales maestras de Administrador (regla de clave 'oo' / '00')
  const isAdminUser = u === 'admin' || u === 'uees';
  const isAdminPass = p === 'oo' || p === '00' || p === 'OO';

  if (isAdminUser && isAdminPass) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
      localStorage.setItem(LOGGED_USER_KEY, 'Admin');
      localStorage.setItem(ACTIVE_USERNAME_KEY, 'admin');
      localStorage.setItem(USER_ROLE_KEY, 'admin');
      localStorage.removeItem(NEW_USER_PENDING_WIZARD_KEY);
    } catch {}

    return {
      success: true,
      user: { username: 'admin', displayName: 'Admin', role: 'admin', isNew: false },
    };
  }

  // 2. Verificación en catálogo de usuarios locales registrados (Offline-first rápido)
  const registered = getRegisteredUsers();
  const foundLocal = registered.find((user) => user.username === u);

  if (foundLocal) {
    if (foundLocal.password === p) {
      const isNew = localStorage.getItem(NEW_USER_PENDING_WIZARD_KEY) === 'true';
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
        localStorage.setItem(LOGGED_USER_KEY, foundLocal.displayName);
        localStorage.setItem(ACTIVE_USERNAME_KEY, foundLocal.username);
        localStorage.setItem(USER_ROLE_KEY, 'user');
      } catch {}

      // Sincronizar en segundo plano hacia Supabase por si no estaba
      syncUserAccountToCloud(foundLocal).catch(() => {});

      return {
        success: true,
        user: {
          username: foundLocal.username,
          displayName: foundLocal.displayName,
          role: 'user',
          isNew,
        },
      };
    }
  }

  // 3. Si no existe localmente (o la clave cambió en otro dispositivo), consultar Supabase en la nube
  const cloudUser = await syncUserAccountFromCloud(u);

  if (cloudUser) {
    if (cloudUser.password === p) {
      // Guardar o actualizar en catálogo local
      try {
        const updatedUsers = registered.filter((user) => user.username !== u);
        updatedUsers.push(cloudUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

        localStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
        localStorage.setItem(LOGGED_USER_KEY, cloudUser.displayName);
        localStorage.setItem(ACTIVE_USERNAME_KEY, cloudUser.username);
        localStorage.setItem(USER_ROLE_KEY, 'user');
      } catch {}

      return {
        success: true,
        user: {
          username: cloudUser.username,
          displayName: cloudUser.displayName,
          role: 'user',
          isNew: false,
        },
      };
    } else {
      return { success: false, error: 'Contraseña incorrecta. Por favor intenta de nuevo.' };
    }
  }

  // 4. Si intentó ingresar como admin con clave errónea
  if (isAdminUser && !isAdminPass) {
    return { success: false, error: 'Clave de administrador incorrecta.' };
  }

  return {
    success: false,
    error: 'Usuario no encontrado. Si es tu primera vez aquí, crea una cuenta en "Registrarse".',
  };
}

/**
 * Resuelve la clave de almacenamiento adecuada para el usuario
 * Para Admin: 'academic_dashboard_data_v2' (preservación histórica de datos)
 * Para Estudiantes: 'academic_dashboard_data_user_<username>' (aislamiento privado)
 */
export function getUserDashboardStorageKey(
  username?: string | null,
  role?: 'admin' | 'user' | null
): string {
  const currentRole = role || (localStorage.getItem(USER_ROLE_KEY) as 'admin' | 'user') || 'admin';
  const currentU = username || localStorage.getItem(ACTIVE_USERNAME_KEY) || 'admin';

  if (currentRole === 'admin' || currentU.toLowerCase() === 'admin' || currentU.toLowerCase() === 'uees') {
    return 'academic_dashboard_data_v2';
  }

  return `academic_dashboard_data_user_${currentU.toLowerCase()}`;
}

/**
 * Comprueba si la sesión activa tiene privilegios de Administrador
 */
export function isUserAdmin(): boolean {
  try {
    const role = localStorage.getItem(USER_ROLE_KEY);
    const user = (localStorage.getItem(ACTIVE_USERNAME_KEY) || '').toLowerCase();
    return role === 'admin' || user === 'admin' || user === 'uees';
  } catch {
    return false;
  }
}

/**
 * Genera un Dashboard completo y robusto de 20 semanas para un nuevo usuario registrado
 */
export function createInitialDashboardForUser(rawUsername: string, rawDisplayName?: string): Dashboard {
  const username = (rawUsername || 'estudiante').trim().toLowerCase();
  const displayName = (rawDisplayName || username).trim();
  const dashId = `dash-user-${username}`;
  const startDateISO = '2026-07-06';
  const startDate = '06 JUL 2026';

  const subjects: SubjectItem[] = [
    { id: `subj-${username}-1`, name: 'Bases de Datos' },
    { id: `subj-${username}-2`, name: 'Programación' },
    { id: `subj-${username}-3`, name: 'Matemática' },
    { id: `subj-${username}-4`, name: 'Física / Redes' },
  ];

  const defaultTaskNames = ['Foro entregado', 'Tarea entregada'];
  const totalWeeks = 20;
  const weeks: WeekItem[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const isParcial = w === 6 || w === 12 || w === 18;
    const taskNames = isParcial ? ['Examen Parcial entregado'] : defaultTaskNames;
    const subjectTasks: Record<string, TaskItem[]> = {};

    subjects.forEach((subj) => {
      subjectTasks[subj.id] = taskNames.map((tName, tIdx) => ({
        id: `task-${w}-${subj.id}-${tIdx}`,
        name: tName,
        completed: false,
      }));
    });

    weeks.push({
      id: `week-${w}-${dashId}`,
      weekNumber: w,
      dateRange: computeWeekRangeFromDate(w, startDateISO),
      status: w === 1 ? 'EN PROCESO' : 'PENDIENTE',
      subjectTasks,
      bloqueTareas: [],
    });
  }

  const activeWeekId = weeks[0].id;
  const now = new Date();
  const lastUpdated = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}`;

  return {
    id: dashId,
    name: `Ciclo Académico - ${displayName}`,
    startDate,
    startDateISO,
    lastUpdated,
    subjects,
    defaultTaskNames,
    weeks,
    activeWeekId,
    accessCode: 'oo',
    quickNote: '¡Bienvenido a tu ciclo académico personal!',
  };
}
