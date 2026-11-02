/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de Autenticación, Registro y Control de Roles de Usuario
 * UEES Academic Dashboard
 */

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
 * Registra un nuevo estudiante/usuario en el sistema local
 */
export function registerNewUser(
  rawUsername: string,
  rawDisplayName: string,
  rawPassword: string
): { success: boolean; error?: string; user?: RegisteredUser } {
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

  const existingUsers = getRegisteredUsers();
  const exists = existingUsers.some((u) => u.username === username);
  if (exists) {
    return {
      success: false,
      error: `El usuario "${username}" ya existe. Inicia sesión o elige otro nombre.`,
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

    return { success: true, user: newUser };
  } catch (e) {
    return { success: false, error: 'No se pudo guardar el registro en el almacenamiento local.' };
  }
}

/**
 * Autentica un usuario existente (Admin o Estudiante registrado)
 */
export function authenticateUser(
  rawUsername: string,
  rawPassword: string
): {
  success: boolean;
  error?: string;
  user?: { username: string; displayName: string; role: 'admin' | 'user'; isNew?: boolean };
} {
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

  // 2. Verificación en catálogo de usuarios locales registrados
  const registered = getRegisteredUsers();
  const found = registered.find((user) => user.username === u);

  if (found) {
    if (found.password === p) {
      const isNew = localStorage.getItem(NEW_USER_PENDING_WIZARD_KEY) === 'true';
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
        localStorage.setItem(LOGGED_USER_KEY, found.displayName);
        localStorage.setItem(ACTIVE_USERNAME_KEY, found.username);
        localStorage.setItem(USER_ROLE_KEY, 'user');
      } catch {}

      return {
        success: true,
        user: {
          username: found.username,
          displayName: found.displayName,
          role: 'user',
          isNew,
        },
      };
    } else {
      return { success: false, error: 'Contraseña incorrecta. Por favor intenta de nuevo.' };
    }
  }

  // 3. Si ingresó como admin pero clave errónea
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
