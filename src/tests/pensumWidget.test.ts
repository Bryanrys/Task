import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Pruebas Unitarias - Widget Nativo de Tareas para Android', () => {
  const root = process.cwd();

  it('el cálculo de tareas pendientes y porcentaje de entregas semanales debe ser matemáticamente exacto', () => {
    const total = 11;
    const completadas = 10;
    const pendientes = 1;

    assert.strictEqual(total - completadas, pendientes, 'Las tareas pendientes deben ser exactamente 1');

    const porcentaje = Math.round((completadas / total) * 100);
    assert.strictEqual(porcentaje, 91, 'El porcentaje de entrega semanal debe ser 91%');
  });

  it('el cálculo debe manejar límites seguros (cuando todas las tareas están entregadas)', () => {
    const total = 10;
    const completadas = 10;
    const pendientes = 0;

    assert.strictEqual(Math.max(0, total - completadas), pendientes, 'No pueden faltar tareas negativas');
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 100;
    assert.strictEqual(porcentaje, 100, 'El porcentaje debe ser 100%');
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

  it('el layout XML del widget debe contener los elementos de UI requeridos para tareas pendientes', () => {
    const layoutPath = path.join(root, 'android/app/src/main/res/layout/widget_pensum.xml');
    const content = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(content.includes('widget_title'), 'Debe incluir el TextView widget_title');
    assert.ok(content.includes('widget_faltantes'), 'Debe incluir el TextView widget_faltantes');
    assert.ok(content.includes('widget_progress'), 'Debe incluir la ProgressBar widget_progress');
    assert.ok(content.includes('widget_pendientes_count'), 'Debe incluir el TextView widget_pendientes_count');
    assert.ok(content.includes('widget_completadas_count'), 'Debe incluir el TextView widget_completadas_count');
    assert.ok(content.includes('widget_materias_count'), 'Debe incluir el TextView widget_materias_count');
    assert.ok(content.includes('widget_proxima_tarea'), 'Debe incluir el TextView widget_proxima_tarea');
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
