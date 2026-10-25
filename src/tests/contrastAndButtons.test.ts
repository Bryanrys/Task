import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Pruebas Unitarias Estrictas - Contraste y Legibilidad de Botones (Modo Oscuro / Claro)', () => {
  const srcDir = path.resolve(process.cwd(), 'src');

  function getAllTsxFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (file !== 'tests') {
          results = results.concat(getAllTsxFiles(filePath));
        }
      } else if (/\.tsx$/.test(file)) {
        results.push(filePath);
      }
    }
    return results;
  }

  // 1. Verificación de exclusión de combinaciones ilegibles (oklch text-zinc-950 sobre bg-white)
  it('ningún botón o contenedor interactivo debe combinar bg-white con text-zinc-950 sin fallback hexadecimal seguro', () => {
    const files = getAllTsxFiles(srcDir);
    const forbiddenPattern = /bg-white\s+text-zinc-950|text-zinc-950\s+bg-white/g;
    const matches: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (forbiddenPattern.test(line)) {
          matches.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }

    assert.equal(
      matches.length,
      0,
      `Se encontraron botones con bg-white y text-zinc-950 (vulnerable a bug de rendering oklch en WebView):\n${JSON.stringify(matches, null, 2)}`
    );
  });

  // 2. Verificación estricta de que no existen botones o clases con fondo y texto del mismo color
  it('no deben existir botones o clases con combinación idéntica de fondo y texto (blanco sobre blanco o negro sobre negro)', () => {
    const files = getAllTsxFiles(srcDir);
    const invalidMatches: { file: string; line: number; text: string; issue: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Extraer todos los literales de texto/clases delimitados por comillas simples, dobles o backticks
        const strRegex = /['"`]([^'"`\n]+)['"`]/g;
        let match;
        while ((match = strRegex.exec(line)) !== null) {
          const str = match[1];

          // 1. Fondo blanco sólido con texto blanco o casi blanco
          const hasSolidWhiteBg = /\bbg-white\b(?!\/)/.test(str);
          const hasWhiteText = /\btext-(white|zinc-50|zinc-100)\b/.test(str);
          if (hasSolidWhiteBg && hasWhiteText) {
            invalidMatches.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              text: str.trim(),
              issue: 'Fondo blanco sólido combinado con texto blanco (ilegible)',
            });
          }

          // 2. Fondo negro sólido con texto negro o grafito
          const hasSolidBlackBg = /\b(bg-black|bg-zinc-950)\b(?!\/)/.test(str);
          const hasBlackText = /\b(text-black|text-zinc-950|text-zinc-900)\b/.test(str);
          if (hasSolidBlackBg && hasBlackText) {
            invalidMatches.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              text: str.trim(),
              issue: 'Fondo negro/grafito sólido combinado con texto negro (ilegible)',
            });
          }
        }
      });
    }

    assert.equal(
      invalidMatches.length,
      0,
      `Se encontraron botones con texto y fondo del mismo color:\n${JSON.stringify(invalidMatches, null, 2)}`
    );
  });

  // 3. Verificación de que SidebarNav en drawer móvil recibe props de tema
  it('App.tsx debe suministrar isDark y themeMode al SidebarNav del menú móvil', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    // Buscar sección del Mobile Sidebar Overlay Drawer
    const drawerMarker = '{/* Mobile Sidebar Overlay Drawer */}';
    const drawerIndex = content.indexOf(drawerMarker);
    assert.ok(drawerIndex !== -1, 'Debe existir la sección Mobile Sidebar Overlay Drawer en App.tsx');

    const mobileSidebarSection = content.slice(drawerIndex, drawerIndex + 3000);

    assert.ok(
      mobileSidebarSection.includes('isDark={isDark}'),
      'SidebarNav en el menú móvil debe recibir la prop isDark={isDark}'
    );
    assert.ok(
      mobileSidebarSection.includes('themeMode={themeMode}'),
      'SidebarNav en el menú móvil debe recibir la prop themeMode={themeMode}'
    );
  });

  // 4. Verificación de overrides seguros en index.css
  it('src/index.css debe contener reglas hexadecimales seguras contra bugs de oklch en WebView', () => {
    const cssPath = path.join(srcDir, 'index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(
      content.includes('.text-zinc-950') && content.includes('#09090b'),
      'index.css debe incluir override seguro para .text-zinc-950 con valor hexadecimal'
    );
    assert.ok(
      content.includes('button.bg-white') || content.includes('.bg-white > span'),
      'index.css debe forzar color negro a botones con fondo blanco'
    );
  });

  // 5. Verificación de textos limpios y ausencia de signos redundantes (+ Agregar duplicado)
  it('los botones con icono Plus no deben contener el texto redundante "+ Agregar"', () => {
    const files = getAllTsxFiles(srcDir);
    const redundantButtons: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Detectar si en la misma línea o bloque hay span con "+ Agregar"
        if (/<span>\s*\+\s*Agregar/i.test(line)) {
          redundantButtons.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }

    assert.equal(
      redundantButtons.length,
      0,
      `Se encontraron botones con texto redundante "+ Agregar":\n${JSON.stringify(redundantButtons, null, 2)}`
    );
  });

  // 6. Verificación de aislamiento del botón lápiz de notas frente a completitud de tareas
  it('App.tsx debe aislar el evento onClick del lápiz de notas con stopPropagation', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    assert.ok(
      content.includes('setActiveNoteTarget({') && content.includes('e.stopPropagation()'),
      'El botón de notas de la tarea debe aislar el evento con stopPropagation para evitar completar la tarea accidentalmente'
    );
  });

  // 5. Verificación Matemática de Contraste WCAG 2.1 AA (Relación >= 4.5:1 para texto normal y >= 3.0:1 para componentes)
  describe('Cálculo Matemático WCAG de Luminancia y Contraste', () => {
    function hexToRgb(hex: string): [number, number, number] {
      const cleanHex = hex.replace('#', '');
      const num = parseInt(cleanHex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    function relativeLuminance(rgb: [number, number, number]): number {
      const srgb = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const l1 = relativeLuminance(hexToRgb(hex1));
      const l2 = relativeLuminance(hexToRgb(hex2));
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    it('Modo Oscuro: texto principal blanco (#ffffff) sobre fondo grafito (#09090b) supera WCAG AAA (> 7:1)', () => {
      const ratio = contrastRatio('#ffffff', '#09090b');
      assert.ok(ratio >= 15.0, `Ratio obtenido: ${ratio.toFixed(2)}:1 (requerido >= 7.0:1)`);
    });

    it('Modo Oscuro: botón activo blanco (#ffffff) con texto negro (#000000) supera WCAG AAA (> 7:1)', () => {
      const ratio = contrastRatio('#000000', '#ffffff');
      assert.ok(ratio >= 19.0, `Ratio obtenido: ${ratio.toFixed(2)}:1 (requerido >= 7.0:1)`);
    });

    it('Modo Claro: texto principal negro (#18181b) sobre fondo (#f4f4f2) supera WCAG AAA (> 7:1)', () => {
      const ratio = contrastRatio('#18181b', '#f4f4f2');
      assert.ok(ratio >= 12.0, `Ratio obtenido: ${ratio.toFixed(2)}:1 (requerido >= 7.0:1)`);
    });

    it('Modo Claro: botón activo negro (#09090b) con texto blanco (#ffffff) supera WCAG AAA (> 7:1)', () => {
      const ratio = contrastRatio('#ffffff', '#09090b');
      assert.ok(ratio >= 15.0, `Ratio obtenido: ${ratio.toFixed(2)}:1 (requerido >= 7.0:1)`);
    });

    it('Insignias modo claro: texto ámbar 800 (#92400e) sobre fondo (#fef3c7) supera WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio('#92400e', '#fef3c7');
      assert.ok(ratio >= 4.5, `Ratio obtenido: ${ratio.toFixed(2)}:1 (requerido >= 4.5:1)`);
    });

    it('Insignias modo claro: texto verde esmeralda 800 (#065f46) sobre fondo (#ecfdf5) supera WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio('#065f46', '#ecfdf5');
      assert.ok(ratio >= 4.5, `Ratio obtenido: ${ratio.toFixed(2)}:1 (requerido >= 4.5:1)`);
    });
  });

  // 7. Verificación de visualización Edge-to-Edge (Barra de estado transparente y cutout sin muesca cortada)
  it('la app debe configurar Edge-to-Edge y viewport-fit=cover para extender el fondo detrás de la muesca', () => {
    // 1. index.html debe tener viewport-fit=cover
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(indexContent.includes('viewport-fit=cover'), 'index.html debe incluir viewport-fit=cover');

    // 2. styles.xml debe declarar transparencia y shortEdges para cutout
    const stylesPath = path.resolve(process.cwd(), 'android/app/src/main/res/values/styles.xml');
    const stylesContent = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(stylesContent.includes('android:windowLayoutInDisplayCutoutMode'), 'styles.xml debe configurar windowLayoutInDisplayCutoutMode');
    assert.ok(stylesContent.includes('@android:color/transparent'), 'styles.xml debe tener barra de estado transparente');

    // 3. MainActivity.java debe activar setDecorFitsSystemWindows(window, false)
    const mainActivityPath = path.resolve(process.cwd(), 'android/app/src/main/java/com/uees/dashboard/MainActivity.java');
    const javaContent = fs.readFileSync(mainActivityPath, 'utf-8');
    assert.ok(javaContent.includes('setDecorFitsSystemWindows'), 'MainActivity.java debe habilitar setDecorFitsSystemWindows(window, false)');
    assert.ok(javaContent.includes('LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES'), 'MainActivity.java debe activar shortEdges en runtime');
  });
});
