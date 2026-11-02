/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Pruebas Unitarias - Bloqueo de Base de Datos y Optimización Multi-Usuario', () => {
  const srcDir = path.resolve(process.cwd(), 'src');

  it('el diálogo para ingresar clave de descarga de base de datos nunca debe autocompletar el código por defecto', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    // Buscar PromptModal de descarga
    const promptModalMarker = 'isOpen={showDownloadPrompt}';
    assert.ok(content.includes(promptModalMarker), 'Debe existir el PromptModal para showDownloadPrompt');

    const promptSection = content.slice(content.indexOf(promptModalMarker), content.indexOf(promptModalMarker) + 400);
    assert.match(
      promptSection,
      /defaultValue=""/,
      'El campo defaultValue debe ser estrictamente una cadena vacía "" sin autocompletar la clave'
    );
  });

  it('la pantalla LoginScreen debe soportar cambio a modo Registro y creación de cuentas', () => {
    const loginPath = path.join(srcDir, 'components', 'LoginScreen.tsx');
    const content = fs.readFileSync(loginPath, 'utf-8');

    assert.ok(content.includes('Registrarse'), 'Debe incluir pestaña o botón de Registro');
    assert.ok(content.includes('handleRegisterSubmit'), 'Debe manejar el envío del formulario de registro');
    assert.ok(content.includes('Crear mi Cuenta de Estudiante'), 'Debe tener botón de creación de cuenta');
    assert.ok(content.includes('registerNewUser'), 'Debe invocar el servicio registerNewUser');
  });

  it('App.tsx debe proteger las operaciones de descarga y subida a la nube contra usuarios no administradores', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    // Verificar que handleTriggerCloudDownload valida isAdmin
    const dlSection = content.slice(content.indexOf('const handleTriggerCloudDownload ='), content.indexOf('const handleTriggerCloudDownload =') + 400);
    assert.ok(dlSection.includes('!isAdmin'), 'handleTriggerCloudDownload debe validar !isAdmin');

    // Verificar que handleConfirmUpload valida isAdmin
    const upSection = content.slice(content.indexOf('const handleConfirmUpload ='), content.indexOf('const handleConfirmUpload =') + 400);
    assert.ok(upSection.includes('!isAdmin'), 'handleConfirmUpload debe validar !isAdmin');
  });

  it('la vista de nube currentView === "cloud" debe mostrar tarjeta de acceso restringido a no-admins', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    assert.ok(
      content.includes('Acceso Reservado al Administrador'),
      'Debe mostrar mensaje de restricción de base de datos a usuarios normales'
    );
  });

  it('SidebarNav y UnifiedDashboardHeader deben recibir la prop isAdmin para proteger la base de datos', () => {
    const sidebarPath = path.join(srcDir, 'components', 'SidebarNav.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
    assert.ok(sidebarContent.includes('isAdmin'), 'SidebarNav debe declarar prop isAdmin');

    const headerPath = path.join(srcDir, 'components', 'UnifiedDashboardHeader.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');
    assert.ok(headerContent.includes('isAdmin'), 'UnifiedDashboardHeader debe declarar prop isAdmin');
  });
});
