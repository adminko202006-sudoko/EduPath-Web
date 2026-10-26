import test from 'node:test';
import assert from 'node:assert/strict';
import { startVisibleRefresh } from '../src/services/visibleRefresh.js';

function environment() {
  let tick;
  let cleared = false;
  return {
    document: { visibilityState: 'visible' },
    window: { navigator: { onLine: true }, setInterval(fn, ms) { assert.equal(ms, 15000); tick = fn; return 1; }, clearInterval() { cleared = true; } },
    tick: () => tick(),
    get cleared() { return cleared; },
  };
}

test('document refresh runs only while visible and online and stops on cleanup', async () => {
  const env = environment(); let calls = 0;
  const stop = startVisibleRefresh(async () => { calls++; }, 15000, env);
  await env.tick(); assert.equal(calls, 1);
  env.document.visibilityState = 'hidden'; await env.tick(); assert.equal(calls, 1);
  env.document.visibilityState = 'visible'; env.window.navigator.onLine = false;
  await env.tick(); assert.equal(calls, 1);
  env.window.navigator.onLine = true; await env.tick(); assert.equal(calls, 2);
  stop(); await env.tick(); assert.equal(calls, 2); assert.equal(env.cleared, true);
});

test('slow requests do not overlap and a failed request can retry', async () => {
  const env = environment(); let calls = 0; let fail; let errors = 0;
  const stop = startVisibleRefresh(() => {
    calls++;
    return calls === 1 ? new Promise((_, reject) => { fail = reject; }) : Promise.resolve();
  }, 15000, { ...env, onError: () => { errors++; } });
  const first = env.tick();
  await env.tick(); assert.equal(calls, 1);
  fail(new Error('network failure')); await first; assert.equal(errors, 1);
  await env.tick(); assert.equal(calls, 2);
  stop();
});
