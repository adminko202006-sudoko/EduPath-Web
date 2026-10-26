import test from 'node:test';
import assert from 'node:assert/strict';
import { startPresenceHeartbeat } from '../src/services/presenceHeartbeat.js';

function environment() {
  const docEvents = new Map(), winEvents = new Map();
  let interval, cleared = false;
  return {
    document: { visibilityState: 'visible', addEventListener: (key, fn) => docEvents.set(key, fn), removeEventListener: (key) => docEvents.delete(key) },
    window: { navigator: { onLine: true }, setInterval: (fn, ms) => { assert.equal(ms, 30000); interval = fn; return 1; }, clearInterval: () => { cleared = true; }, addEventListener: (key, fn) => winEvents.set(key, fn), removeEventListener: (key) => winEvents.delete(key) },
    tick: () => interval(), change: () => docEvents.get('visibilitychange')?.(), reconnect: () => winEvents.get('online')?.(),
    get cleared() { return cleared && docEvents.size === 0 && winEvents.size === 0; },
  };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('only visible online clients pulse, and cleanup removes timers and listeners', async () => {
  const env = environment(); let calls = 0;
  const stop = startPresenceHeartbeat(async () => { calls++; }, env);
  await flush(); assert.equal(calls, 1);
  env.document.visibilityState = 'hidden'; await env.tick(); assert.equal(calls, 1);
  env.document.visibilityState = 'visible'; await env.change(); assert.equal(calls, 2);
  env.window.navigator.onLine = false; await env.tick(); assert.equal(calls, 2);
  env.window.navigator.onLine = true; await env.reconnect(); assert.equal(calls, 3);
  stop(); await env.tick(); assert.equal(calls, 3); assert.equal(env.cleared, true);
});

test('a pending heartbeat cannot overlap and failed calls can retry', async () => {
  const env = environment(); let calls = 0, rejectFirst, errors = 0;
  const stop = startPresenceHeartbeat(() => { calls++; return calls === 1 ? new Promise((_, reject) => { rejectFirst = reject; }) : Promise.resolve(); }, { ...env, onError: () => { errors++; } });
  await env.tick(); assert.equal(calls, 1);
  rejectFirst(new Error('network')); await flush(); assert.equal(errors, 1);
  await env.tick(); assert.equal(calls, 2);
  stop();
});
