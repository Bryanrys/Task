import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Pruebas Unitarias - Widget Nativo de Pensum para Android', () => {
  const root = process.cwd();

  it('el cálculo de materias faltantes y porcentaje de avance debe ser matemáticamente exacto', () => {
    const total = 45;
    const aprobadas = 28;
    const enCurso = 5;

    const faltantes = Math.max(0, total - aprobadas - enCurso);
    assert.strictEqual(faltantes, 12, 'Deben faltar exactamente 12 materias');

    // Avance con peso de 0.5 para materias en curso
    const porcentaje = Math.round(((aprobadas + (enCurso * 0.5)) / total) * 100);
    assert.strictEqual(porcentaje, 68, 'El porcentaje debe ser 68%');

    const ciclosRestantes = (faltantes / enCurso).toFixed(1);
    assert.strictEqual(ciclosRestantes, '2.4', 'Los ciclos estimados deben ser 2.4');
  });

  it('el cálculo debe manejar límites seguros (cuando ya se aprobaron todas las materias)', () => {
    const total = 45;
    const aprobadas = 45;
    const enCurso = 2;

    const faltantes = Math.max(0, total - aprobadas - enCurso);
    assert.strictEqual(faltantes, 0, 'No pueden faltar materias negativas');

    const porcentaje = Math.min(100, Math.round(((aprobadas + (enCurso * 0.5)) / total) * 100));
    assert.strictEqual(porcentaje, 100, 'El porcentaje máximo debe estar acotado a 100%');
  });

  it('AndroidManifest.xml debe registrar el Receiver PensumWidgetProvider con widget_pensum_info', () => {
    const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml');
    const content = fs.readFileSync(manifestPath, 'utf8');

    assert.ok(
      content.includes('android:name=".PensumWidgetProvider"'),
      'PensumWidgetProvider debe estar registrado en el AndroidManifest.xml'
    );
    assert.ok(
      content.includes('@xml/widget_pensum_info'),
      'El receiver debe vincular el recurso @xml/widget_pensum_info'
    );
  });

  it('el layout XML del widget debe contener los elementos de UI requeridos', () => {
    const layoutPath = path.join(root, 'android/app/src/main/res/layout/widget_pensum.xml');
    const content = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(content.includes('widget_faltantes'), 'Debe incluir el TextView widget_faltantes');
    assert.ok(content.includes('widget_progress'), 'Debe incluir la ProgressBar widget_progress');
    assert.ok(content.includes('widget_aprobadas'), 'Debe incluir el TextView widget_aprobadas');
    assert.ok(content.includes('widget_en_curso'), 'Debe incluir el TextView widget_en_curso');
    assert.ok(content.includes('widget_pct_badge'), 'Debe incluir el TextView widget_pct_badge');
  });

  it('MainActivity.java debe registrar el plugin nativo PensumWidgetPlugin', () => {
    const mainActivityPath = path.join(root, 'android/app/src/main/java/com/uees/dashboard/MainActivity.java');
    const content = fs.readFileSync(mainActivityPath, 'utf8');

    assert.ok(
      content.includes('registerPlugin(PensumWidgetPlugin.class);'),
      'MainActivity.java debe registrar PensumWidgetPlugin'
    );
  });

  it('strings.xml debe conservar la regla de identidad multi-dispositivo con app_name="0"', () => {
    const stringsPath = path.join(root, 'android/app/src/main/res/values/strings.xml');
    const content = fs.readFileSync(stringsPath, 'utf8');

    assert.ok(content.includes('<string name="app_name">0</string>'), 'app_name debe ser "0"');
    assert.ok(content.includes('<string name="title_activity_main">0</string>'), 'title_activity_main debe ser "0"');
  });
});
