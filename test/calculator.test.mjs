import { test } from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../dist/cli.js';
import { calculate } from '../dist/calculator.js';

const base = { bore: 63, rod: 36, pressure: 100 };
const close = (actual, expected, tolerance) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);
const cli = (...args) => {
  const lines = [];
  const original = console.log;
  console.log = (...values) => lines.push(values.join(' '));
  try {
    main(args);
    return { status: 0, stdout: lines.join('\n'), stderr: '' };
  } catch (error) {
    return { status: 1, stdout: lines.join('\n'), stderr: `Error: ${error.message}` };
  } finally { console.log = original; }
};
const required = ['--bore', '63', '--rod', '36', '--pressure', '100'];

test('reference areas, forces, efficiency and ratio', () => {
  const r = calculate(base);
  close(r.pistonArea.mm2, 3117.2, 0.05);
  close(r.annulusArea.mm2, 2099.4, 0.05);
  close(r.forceKN.extend.theoretical, 31.17, 0.005);
  close(r.forceKN.retract.theoretical, 20.99, 0.005);
  assert.equal(r.pistonArea.cm2, r.pistonArea.mm2 / 100);
  assert.equal(r.annulusArea.cm2, r.annulusArea.mm2 / 100);
  assert.equal(r.forceKN.extend.withEfficiency, r.forceKN.extend.theoretical * 0.9);
  assert.equal(r.forceKN.retract.withEfficiency, r.forceKN.retract.theoretical * 0.9);
  assert.equal(r.areaRatio, r.pistonArea.mm2 / r.annulusArea.mm2);
  assert.equal(r.speedMmPerS, undefined);
  assert.equal(r.timeS, undefined);
  assert.equal(r.oilVolumeL, undefined);
});

test('flow, stroke, volumes and travel times', () => {
  const r = calculate({ ...base, flow: 20, stroke: 500, efficiency: 0.8 });
  close(r.speedMmPerS.extend, 106.9, 0.05);
  close(r.speedMmPerS.retract, 158.78, 0.01);
  close(r.oilVolumeL.extend, 1.5586, 0.0001);
  close(r.oilVolumeL.retract, 1.0497, 0.0001);
  for (const direction of ['extend', 'retract']) {
    close(r.timeS[direction], r.oilVolumeL[direction] / 20 * 60, 1e-12);
    assert.equal(r.forceKN[direction].withEfficiency, r.forceKN[direction].theoretical * 0.8);
  }
  assert.equal(calculate({ ...base, flow: 20 }).timeS, undefined);
  const strokeOnly = calculate({ ...base, stroke: 500 });
  assert.ok(strokeOnly.oilVolumeL);
  assert.equal(strokeOnly.timeS, undefined);
});

test('invalid dimensions and nonpositive/nonfinite inputs', () => {
  for (const key of ['bore', 'rod', 'pressure', 'flow', 'stroke', 'efficiency']) {
    for (const value of [0, -1, NaN, Infinity]) assert.throws(() => calculate({ ...base, [key]: value }), new RegExp(key));
  }
  for (const rod of [63, 64]) assert.throws(() => calculate({ ...base, rod }), /smaller/);
});

test('CLI text, JSON and help', () => {
  const text = cli(...required, '--flow', '20', '--stroke', '500');
  assert.equal(text.status, 0, text.stderr);
  for (const fragment of ['3117.2 mm²', '2099.4 mm²', '31.17 kN', '20.99 kN', '106.9 mm/s', 'Extend time:', 'Retract oil volume:', 'Area ratio']) assert.ok(text.stdout.includes(fragment));
  const json = cli(...required, '--json');
  assert.equal(json.status, 0, json.stderr);
  assert.deepEqual(JSON.parse(json.stdout), calculate(base));
  assert.equal(cli('--help').status, 0);
  assert.match(cli('--help').stdout, /Usage:/);
});

test('CLI failures are clear and exit nonzero', () => {
  for (const args of [[], ['--bore'], [...required, '--flow'], [...required, '--flow', 'abc'], [...required, '--flow', '0'], [...required, '--stroke', '-1'], [...required, '--unknown'], [...required, '--bore', '64'], ['--bore', '36', '--rod', '63', '--pressure', '100']]) {
    const r = cli(...args);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Error:/);
    assert.equal(r.stdout, '');
  }
});
