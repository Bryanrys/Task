import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDeadlineStatus } from '../utils/deadline.js';

describe('Pruebas Unitarias - Cálculo de Fechas Límite (Deadlines)', () => {
  it('debe retornar null para valores vacíos o indefinidos', () => {
    assert.equal(getDeadlineStatus(undefined), null);
    assert.equal(getDeadlineStatus(''), null);
    assert.equal(getDeadlineStatus('fecha-invalida'), null);
  });

  it('debe identificar correctamente una tarea vencida (isPast: true, isUrgent: true)', () => {
    // Fecha de hace 3 horas
    const pastDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const status = getDeadlineStatus(pastDate);

    assert.ok(status);
    assert.equal(status.isPast, true);
    assert.equal(status.isUrgent, true);
    assert.match(status.text, /Venció hace 3h|hace unos minutos/);
  });

  it('debe marcar urgente para entregas del mismo día (isPast: false, isUrgent: true)', () => {
    // Fecha dentro de 4 horas
    const soonDate = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const status = getDeadlineStatus(soonDate);

    assert.ok(status);
    assert.equal(status.isPast, false);
    assert.equal(status.isUrgent, true);
    assert.match(status.text, /⚠️ Vence en/);
  });

  it('debe marcar no urgente para entregas con más de 2 días de anticipación', () => {
    // Fecha dentro de 5 días (+ 1 hora de margen)
    const futureDate = new Date(Date.now() + (5 * 24 + 1) * 60 * 60 * 1000).toISOString();
    const status = getDeadlineStatus(futureDate);

    assert.ok(status);
    assert.equal(status.isPast, false);
    assert.equal(status.isUrgent, false);
    assert.match(status.text, /⏳ Faltan \d+ días/);
  });
});
