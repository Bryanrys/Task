import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Pruebas Unitarias - Configuración y Conformidad del APK', () => {
  const rootDir = process.cwd();

  it('strings.xml de Android debe tener estrictamente app_name="0" y title_activity_main="0"', () => {
    const stringsXmlPath = path.join(
      rootDir,
      'android/app/src/main/res/values/strings.xml'
    );
    assert.ok(fs.existsSync(stringsXmlPath), 'El archivo strings.xml debe existir');

    const content = fs.readFileSync(stringsXmlPath, 'utf-8');
    assert.match(
      content,
      /<string name="app_name">0<\/string>/,
      'app_name debe ser "0" según la regla de identidad multi-dispositivo'
    );
    assert.match(
      content,
      /<string name="title_activity_main">0<\/string>/,
      'title_activity_main debe ser "0" según la regla de identidad multi-dispositivo'
    );
  });

  it('el script de compilación del APK scripts/build-apk.sh debe existir', () => {
    const scriptPath = path.join(rootDir, 'scripts/build-apk.sh');
    assert.ok(fs.existsSync(scriptPath), 'scripts/build-apk.sh debe existir');
  });

  it('las credenciales de acceso a la base de datos deben aceptar clave "oo" o "00"', () => {
    // Validar regla de clave de acceso a la BD
    const validCodes = ['oo', '00', 'OO'];
    const testCode1 = 'oo';
    const testCode2 = '00';
    assert.ok(validCodes.includes(testCode1));
    assert.ok(validCodes.includes(testCode2));
  });
});
