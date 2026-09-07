import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(fs.readFileSync('lib/printer-frame-driver.ts', 'utf8'));
const { createPrinterFrameDriver } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

function harness(draw = () => false, fps = 30) {
  const pending = new Map();
  const draws = [];
  let id = 0;
  const driver = createPrinterFrameDriver({
    request: callback => { pending.set(++id, callback); return id; },
    cancel: key => pending.delete(key),
    fps: () => fps,
    draw: (...args) => { draws.push(args); return draw(...args); },
  });
  const tick = now => {
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach(callback => callback(now));
  };
  return { driver, pending, draws, tick };
}

test('holds the completed frame without scheduling idle callbacks, then wakes for late assets', () => {
  const h = harness();
  h.driver.wake(); // Shader compilation has not finished yet.
  assert.equal(h.pending.size, 0);
  h.driver.resume();
  h.tick(100);
  assert.equal(h.draws.length, 1);
  assert.equal(h.pending.size, 0);
  h.tick(60000);
  assert.equal(h.draws.length, 1);
  h.driver.wake(); // GLB finishes loading while idle.
  h.tick(60020);
  assert.equal(h.draws.length, 2);
  assert.equal(h.pending.size, 0);
  assert.ok(Math.abs(h.draws[1][0] - h.draws[0][0] - 1 / 30) < 1e-9);
  assert.equal(h.draws[1][2], true); // Reset the performance sample after idle.
});

test('coalesces scroll/resize updates, caps frame rate and continues until motion settles', () => {
  let moving = true;
  const h = harness(() => moving);
  h.driver.resume();
  for (let i = 0; i < 20; i++) h.driver.wake();
  assert.equal(h.pending.size, 1);
  h.tick(100);
  h.tick(116);
  assert.equal(h.draws.length, 1);
  assert.equal(h.pending.size, 1);
  h.tick(134);
  assert.equal(h.draws.length, 2);
  moving = false;
  h.tick(168);
  assert.equal(h.pending.size, 0);
  h.driver.wake();
  h.tick(5000);
  assert.equal(h.draws.length, 4);
});

test('caps a slow active frame delta and cancels callbacks when hidden or disposed', () => {
  const h = harness(() => true, 60);
  h.driver.resume();
  h.tick(100);
  h.tick(2000);
  assert.ok(Math.abs(h.draws[1][0] - h.draws[0][0] - .1) < 1e-9);
  h.driver.suspend();
  assert.equal(h.pending.size, 0);
  h.driver.wake();
  assert.equal(h.pending.size, 0);
  h.driver.resume();
  h.tick(50000);
  assert.ok(Math.abs(h.draws[2][0] - h.draws[1][0] - 1 / 60) < 1e-9);
  h.driver.dispose();
  h.driver.resume();
  h.driver.wake();
  h.tick(51000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws.length, 3);
});

test('does not lose an asset or resize notification arriving during a draw', () => {
  const h = harness(() => { if (h.draws.length === 1) h.driver.wake(); return false; });
  h.driver.resume();
  h.tick(100);
  assert.equal(h.pending.size, 1);
  h.tick(134);
  assert.equal(h.draws.length, 2);
  assert.equal(h.pending.size, 0);
});
