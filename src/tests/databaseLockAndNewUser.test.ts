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

  it('createInitialDashboardForUser debe generar 20 semanas con tareas inicializadas y activeWeekId exacto', async () => {
    const { createInitialDashboardForUser } = await import('../services/userService');
    const dash = createInitialDashboardForUser('usuario_prueba', 'Estudiante Prueba');

    assert.equal(dash.weeks.length, 20, 'Debe contener exactamente 20 semanas');
    assert.equal(dash.activeWeekId, dash.weeks[0].id, 'activeWeekId debe coincidir exactamente con el id de semana 1');
    assert.equal(dash.subjects.length, 4, 'Debe contener 4 materias por defecto');

    dash.weeks.forEach((w) => {
      dash.subjects.forEach((s) => {
        const tasks = w.subjectTasks[s.id];
        assert.ok(Array.isArray(tasks) && tasks.length > 0, `Cada materia debe tener tareas en semana ${w.weekNumber}`);
      });
    });
  });

  it('LoginScreen debe contener manejo defensivo de errores try/catch en registro y login', () => {
    const loginPath = path.join(srcDir, 'components', 'LoginScreen.tsx');
    const content = fs.readFileSync(loginPath, 'utf-8');

    assert.ok(content.includes('try {'), 'Debe contener bloques try/catch defensivos');
    assert.ok(content.includes('catch (err'), 'Debe capturar errores para evitar bloqueos de pantalla');
  });

  it('ErrorBoundary debe proteger el montaje principal en main.tsx', () => {
    const mainPath = path.join(srcDir, 'main.tsx');
    const content = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(content.includes('<ErrorBoundary>'), 'main.tsx debe envolver App con ErrorBoundary');
  });

  it('OnboardingTutorialModal debe existir y estructurar los 5 pasos profesionales del dashboard', () => {
    const tutorialPath = path.join(srcDir, 'components', 'OnboardingTutorialModal.tsx');
    assert.ok(fs.existsSync(tutorialPath), 'El componente OnboardingTutorialModal.tsx debe existir');
    const content = fs.readFileSync(tutorialPath, 'utf-8');

    assert.ok(content.includes('PASO 1 • CICLO UNIVERSITARIO'), 'Debe incluir paso 1 de semanas y parciales');
    assert.ok(content.includes('PASO 2 • MATERIAS Y ENTREGAS'), 'Debe incluir paso 2 de materias y casillas de tareas');
    assert.ok(content.includes('PASO 3 • RENDIMIENTO ACADÉMICO'), 'Debe incluir paso 3 de calculadora UEES');
    assert.ok(content.includes('PASO 4 • CLASES Y HORARIOS'), 'Debe incluir paso 4 de horario y aulas virtuales');
    assert.ok(content.includes('PASO 5 • PRODUCTIVIDAD TOTAL'), 'Debe incluir paso 5 de pomodoro y multi-dispositivo');
    assert.ok(content.includes('onOpenCustomizer'), 'Debe proveer opción para personalizar materias y fechas');
  });

  it('App.tsx y SidebarNav deben activar el tutorial guiado para usuarios nuevos y brindar acceso manual', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    assert.ok(appContent.includes('OnboardingTutorialModal'), 'App.tsx debe importar y renderizar OnboardingTutorialModal');
    assert.ok(appContent.includes('showTutorial'), 'App.tsx debe gestionar el estado showTutorial');
    assert.ok(appContent.includes('onOpenTutorial'), 'App.tsx debe conectar onOpenTutorial con el Sidebar');

    const sidebarPath = path.join(srcDir, 'components', 'SidebarNav.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
    assert.ok(sidebarContent.includes('onOpenTutorial'), 'SidebarNav.tsx debe declarar la prop onOpenTutorial');
    assert.ok(sidebarContent.includes('Guía & Pasos del Dashboard'), 'SidebarNav.tsx debe mostrar botón de guía en utilidades');
  });
});
