import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUeesGrade,
  normalizeSubjectName,
  findGradeDataForSubject,
  DEFAULT_UEES_GRADES,
} from '../utils/gradeCalculation.js';

describe('Pruebas Unitarias - Cálculo de Notas UEES', () => {
  it('debe calcular acumulado exacto y promedio oficial UEES correctamente (R1: 30%, R2: 30%, R3: 40%)', () => {
    // 10.00 * 0.30 + 8.20 * 0.30 = 3.00 + 2.46 = 5.46
    const res = calculateUeesGrade({
      p1: '10.00',
      p2: '8.20',
      p3: '',
      w1: 30,
      w2: 30,
      w3: 40,
    });

    assert.equal(res.r1, 10);
    assert.equal(res.r2, 8.2);
    assert.equal(res.r3, null);
    assert.equal(res.accumulatedFormatted, '5.46');
    assert.equal(res.ueesAverageFormatted, '5.5');
    assert.equal(res.evaluatedWeight, 60);
    // Para pasar con 6.00: necesita (6.00 - 5.46) / 0.40 = 0.54 / 0.40 = 1.35
    assert.equal(res.neededInR3, '1.35');
    assert.equal(res.passedAlready, false);
  });

  it('debe determinar que la materia ya está aprobada si el acumulado supera 6.0', () => {
    // R1: 10 * 0.3 = 3.0, R2: 10 * 0.3 = 3.0 => Total 6.0
    const res = calculateUeesGrade({
      p1: '10.00',
      p2: '10.00',
      p3: '',
      w1: 30,
      w2: 30,
      w3: 40,
    });

    assert.equal(res.passedAlready, true);
    assert.match(res.neededInR3 || '', /¡Ya aprobaste/);
  });

  it('debe aplicar la reposición al registro que más optimice la nota final', () => {
    // R1: 5.0 (30%), R2: 7.0 (30%), R3: 4.0 (40%)
    // Si repo es 9.0:
    // Sustituir R1: 9*0.3 + 7*0.3 + 4*0.4 = 2.7 + 2.1 + 1.6 = 6.4 (ganancia 4 * 0.3 = +1.2)
    // Sustituir R3: 5*0.3 + 7*0.3 + 9*0.4 = 1.5 + 2.1 + 3.6 = 7.2 (ganancia 5 * 0.4 = +2.0)
    // Debe reemplazar R3 por ser 40%
    const res = calculateUeesGrade({
      p1: '5.00',
      p2: '7.00',
      p3: '4.00',
      repo: '9.00',
      w1: 30,
      w2: 30,
      w3: 40,
    });

    assert.equal(res.replacedRegistro, 3);
    assert.equal(res.effectiveR3, 9.0);
    assert.equal(res.accumulatedFormatted, '7.20');
  });

  it('debe normalizar nombres de materias correctamente (sin tildes, minúsculas)', () => {
    assert.equal(normalizeSubjectName('Matemática II'), 'matematica ii');
    assert.equal(normalizeSubjectName('PROGRAMACIÓN II'), 'programacion ii');
    assert.equal(normalizeSubjectName('  Física II  '), 'fisica ii');
  });

  it('debe encontrar materia en el catálogo por nombre sin importar acentos o espacios', () => {
    const data = findGradeDataForSubject('id-123', 'matematica ii', DEFAULT_UEES_GRADES);
    assert.ok(data);
    assert.equal(data.p1, '8.09');
    assert.equal(data.teacher, 'Noe Salvador Chicas Romero');
  });
});
