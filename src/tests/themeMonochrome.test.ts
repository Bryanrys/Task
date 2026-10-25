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
});
