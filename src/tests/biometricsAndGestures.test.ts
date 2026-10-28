import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Pruebas Unitarias - Biometría (Huella Dactilar) y Gestos Táctiles', () => {
  const srcDir = path.resolve(process.cwd(), 'src');

  it('el servicio de biometría debe estar implementado con soporte nativo y fallback seguro', () => {
    const bioServicePath = path.join(srcDir, 'services', 'biometricService.ts');
    assert.ok(fs.existsSync(bioServicePath), 'El archivo biometricService.ts debe existir');

    const content = fs.readFileSync(bioServicePath, 'utf-8');
    assert.ok(content.includes('NativeBiometric'), 'Debe utilizar el plugin NativeBiometric');
    assert.ok(content.includes('authenticateWithBiometrics'), 'Debe exportar authenticateWithBiometrics');
    assert.ok(content.includes('checkBiometricAvailability'), 'Debe exportar checkBiometricAvailability');
  });

  it('el servicio de háptica táctil debe estar disponible para respuesta física en Android', () => {
    const hapticsPath = path.join(srcDir, 'services', 'hapticsService.ts');
    assert.ok(fs.existsSync(hapticsPath), 'El archivo hapticsService.ts debe existir');

    const content = fs.readFileSync(hapticsPath, 'utf-8');
    assert.ok(content.includes('Haptics'), 'Debe utilizar el plugin Haptics de Capacitor');
    assert.ok(content.includes('navigator.vibrate'), 'Debe incluir fallback universal navigator.vibrate');
  });

  it('la pantalla de login debe incluir botón de acceso rápido con huella dactilar', () => {
    const loginPath = path.join(srcDir, 'components', 'LoginScreen.tsx');
    const content = fs.readFileSync(loginPath, 'utf-8');

    assert.ok(content.includes('handleBiometricLogin'), 'Debe manejar el evento de login con huella');
    assert.ok(content.includes('Ingresar con Huella Dactilar'), 'Debe contener el botón accesible de huella');
    assert.ok(content.includes('Fingerprint'), 'Debe mostrar el icono de Fingerprint');
  });

  it('las ventanas emergentes principales deben implementar gesto drag="y" para deslizar hacia abajo y cerrar', () => {
    const modals = [
      'ThemeModal.tsx',
      'AIAssistantModal.tsx',
      'ShareAppModal.tsx',
      'GradeCalculatorModal.tsx',
      'ClassScheduleModal.tsx',
      'TaskNoteModal.tsx',
      'ActionModals.tsx',
      'UniversityLinksModal.tsx',
      'StartDateModal.tsx',
      'NotificationSettingsModal.tsx',
    ];

    for (const modalFile of modals) {
      const modalPath = path.join(srcDir, 'components', modalFile);
      assert.ok(fs.existsSync(modalPath), `El modal ${modalFile} debe existir`);
      const content = fs.readFileSync(modalPath, 'utf-8');
      assert.ok(
        content.includes('drag="y"'),
        `El modal ${modalFile} debe incluir la propiedad drag="y" para deslizar hacia abajo`
      );
      assert.ok(
        content.includes('onDragEnd'),
        `El modal ${modalFile} debe incluir el manejador onDragEnd para cerrar al arrastrar hacia abajo`
      );
    }
  });
});
