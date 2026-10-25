import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Pruebas Unitarias - Paleta Monocromática (Blanco y Negro)', () => {
  const srcDir = path.resolve(process.cwd(), 'src');

  function getAllFiles(dir: string, extensionRegex: RegExp): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (file !== 'tests') {
          results = results.concat(getAllFiles(filePath, extensionRegex));
        }
      } else if (extensionRegex.test(file)) {
        results.push(filePath);
      }
    }
    return results;
  }

  it('no debe contener ninguna clase Tailwind con colores neón (pink, cyan, purple, fuchsia)', () => {
    const files = getAllFiles(srcDir, /\.(tsx|ts|jsx|js|css)$/);
    const neonRegex = /\b(pink|cyan|purple|fuchsia)-[0-9]{2,3}\b/g;
    const forbiddenMatches: { file: string; line: number; match: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const matches = line.match(neonRegex);
        if (matches) {
          forbiddenMatches.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            match: matches.join(', '),
          });
        }
      });
    }

    assert.equal(
      forbiddenMatches.length,
      0,
      `Se encontraron residuos de colores neón en:\n${JSON.stringify(forbiddenMatches, null, 2)}`
    );
  });

  it('App.tsx debe usar paleta monocromática de alto contraste (zinc, neutral o black/white)', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    // Comprobar que no hay referencias a temas neón anteriores (ej. 'cyberpunk', 'prism', etc.)
    assert.equal(content.includes('neon-'), false, 'App.tsx contiene clases neon-');
    assert.equal(content.includes('cyberpunk'), false, 'App.tsx contiene referencias a tema cyberpunk');
    assert.ok(content.includes('zinc-') || content.includes('neutral-'), 'App.tsx debe usar escala de grises zinc/neutral');
  });

  it('no debe contener clases de colores ámbar o amarillo chillón en el código fuente de componentes', () => {
    const files = getAllFiles(srcDir, /\.(tsx|ts)$/);
    const yellowRegex = /\b(amber|yellow)-[0-9]{2,3}\b/g;
    const forbiddenYellows: { file: string; line: number; match: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const matches = line.match(yellowRegex);
        if (matches) {
          forbiddenYellows.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            match: matches.join(', '),
          });
        }
      });
    }

    assert.equal(
      forbiddenYellows.length,
      0,
      `Se encontraron clases amarillas/ámbar chillón no minimalistas en:\n${JSON.stringify(forbiddenYellows, null, 2)}`
    );
  });

  it('el botón del lápiz de notas y las insignias de notas deben usar la paleta Platino / Titanio', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    // Comprobar que el botón del lápiz usa iluminación de plata/platino cuando tiene nota
    assert.ok(
      content.includes('bg-white/15 border-white/30 text-white shadow-xs'),
      'El botón de nota debe iluminarse en platino/plata cuando tiene nota activa'
    );
    // Comprobar que el badge de nota usa fondo humo/carbón con borde fino
    assert.ok(
      content.includes('bg-white/[0.05] text-zinc-200 border-white/10'),
      'La nota de la tarea debe usar el diseño humo/carbón monocromático'
    );
  });

  it('App.tsx y MainActivity.java deben sincronizar el tema de sistema Android sin corromper el modo AUTO', () => {
    const appPath = path.join(srcDir, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // 1. Debe escuchar el evento nativo androidThemeChange
    assert.ok(
      appContent.includes("window.addEventListener('androidThemeChange'"),
      'App.tsx debe escuchar el evento androidThemeChange para sincronización en tiempo real con Android'
    );

    // 2. No debe sobreescribir THEME_KEY con dark/light cuando themeMode es system
    assert.ok(
      appContent.includes("localStorage.setItem(THEME_KEY, themeMode)"),
      'App.tsx debe guardar estrictamente themeMode en THEME_KEY para no perder el estado AUTO'
    );

    // 3. MainActivity.java debe manejar onConfigurationChanged
    const mainActivityPath = path.resolve(process.cwd(), 'android/app/src/main/java/com/uees/dashboard/MainActivity.java');
    const javaContent = fs.readFileSync(mainActivityPath, 'utf-8');
    assert.ok(
        javaContent.includes('onConfigurationChanged'),
        'MainActivity.java debe implementar onConfigurationChanged para cambios de tema en vivo'
    );
    assert.ok(
        javaContent.includes('androidThemeChange'),
        'MainActivity.java debe despachar el evento androidThemeChange a la WebView'
    );
  });
});
