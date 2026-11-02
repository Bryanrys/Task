/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage in Node environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => (key in mockStorage ? mockStorage[key] : null),
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  },
  length: 0,
  key: (i: number) => Object.keys(mockStorage)[i] || null,
} as unknown as Storage;

import {
  registerNewUser,
  authenticateUser,
  getUserDashboardStorageKey,
  isUserAdmin,
  getRegisteredUsers,
} from '../services/userService';

describe('Pruebas Unitarias - Registro, Autenticación y Control de Roles', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('debe permitir autenticación directa del Administrador con claves oo o 00', () => {
    const res1 = authenticateUser('admin', 'oo');
    assert.equal(res1.success, true);
    assert.equal(res1.user?.role, 'admin');

    const res2 = authenticateUser('uees', '00');
    assert.equal(res2.success, true);
    assert.equal(res2.user?.role, 'admin');

    assert.equal(isUserAdmin(), true);
  });

  it('debe rechazar contraseña incorrecta para usuario administrador', () => {
    const res = authenticateUser('admin', 'passwordIncorrecta');
    assert.equal(res.success, false);
    assert.match(res.error || '', /incorrecta/i);
  });

  it('debe registrar un nuevo usuario estudiante correctamente', () => {
    const regRes = registerNewUser('estudiante1', 'Carlos Gómez', 'miClaveSegura123');
    assert.equal(regRes.success, true);
    assert.equal(regRes.user?.username, 'estudiante1');
    assert.equal(regRes.user?.displayName, 'Carlos Gómez');
    assert.equal(regRes.user?.role, 'user');

    const users = getRegisteredUsers();
    assert.equal(users.length, 1);
    assert.equal(users[0].username, 'estudiante1');

    // Debe permitir iniciar sesión con sus credenciales
    const loginRes = authenticateUser('estudiante1', 'miClaveSegura123');
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.user?.displayName, 'Carlos Gómez');
    assert.equal(loginRes.user?.role, 'user');
    assert.equal(isUserAdmin(), false);
  });

  it('debe impedir registrar usuarios con nombres reservados de administrador', () => {
    const res1 = registerNewUser('admin', 'Falso Admin', '1234');
    assert.equal(res1.success, false);
    assert.match(res1.error || '', /reservado/i);

    const res2 = registerNewUser('uees', 'Falso UEES', '1234');
    assert.equal(res2.success, false);
    assert.match(res2.error || '', /reservado/i);
  });

  it('debe impedir duplicar un usuario ya registrado', () => {
    registerNewUser('maria2026', 'María Solís', 'pass1');
    const duplicateRes = registerNewUser('maria2026', 'Otra María', 'pass2');
    assert.equal(duplicateRes.success, false);
    assert.match(duplicateRes.error || '', /ya existe/i);
  });

  it('debe resolver claves de almacenamiento aisladas para cada usuario', () => {
    const adminKey = getUserDashboardStorageKey('admin', 'admin');
    assert.equal(adminKey, 'academic_dashboard_data_v2');

    const userKey = getUserDashboardStorageKey('carlos', 'user');
    assert.equal(userKey, 'academic_dashboard_data_user_carlos');
  });
});
