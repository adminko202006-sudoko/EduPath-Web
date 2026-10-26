import test from 'node:test';
import assert from 'node:assert/strict';
import { canStartPull, pullDistance, PULL_THRESHOLD } from '../src/services/pullRefreshGesture.js';
import { requestRefresh, subscribeRefresh, notifyRefresh } from '../src/services/refreshBus.js';

test('pull starts only near the top of an idle page outside controls and dialogs', () => {
  const state = { scrollTop: 0, offsetY: 60, interactive: false, busy: false, modalOpen: false };
  assert.equal(canStartPull(state), true);
  for (const overrides of [{ scrollTop: 1 }, { offsetY: 181 }, { offsetY: -1 }, { interactive: true }, { busy: true }, { modalOpen: true }]) {
    assert.equal(canStartPull({ ...state, ...overrides }), false);
  }
});

test('short, upward and horizontal drags cannot trigger a refresh', () => {
  const start = { x: 50, y: 10 };
  assert.equal(pullDistance(start, { x: 50, y: 0 }), 0);
  assert.equal(pullDistance(start, { x: 180, y: 40 }), 0);
  assert.ok(pullDistance(start, { x: 50, y: 100 }) < PULL_THRESHOLD);
  assert.equal(pullDistance(start, { x: 50, y: 154 }), PULL_THRESHOLD);
  assert.equal(pullDistance(start, { x: 50, y: 1000 }), 110);
});

test('manual refresh waits for data and coalesces duplicate gestures', async () => {
  let finish;
  let calls = 0;
  const unsubscribe = subscribeRefresh(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  try {
    const first = requestRefresh();
    assert.equal(requestRefresh(), first);
    let complete = false;
    first.then(() => { complete = true; });
    await Promise.resolve();
    assert.equal(calls, 1);
    assert.equal(complete, false);
    finish();
    await first;
    assert.equal(complete, true);
  } finally { unsubscribe(); }
});

test('a failed subscriber cannot skip others and a later refresh can retry', async () => {
  let calls = 0;
  const stopFailure = subscribeRefresh(() => Promise.reject(new Error('Offline')));
  const stopSuccess = subscribeRefresh(() => { calls++; });
  try {
    await assert.rejects(requestRefresh(), /Offline/);
    assert.equal(calls, 1);
    stopFailure();
    await requestRefresh();
    assert.equal(calls, 2);
  } finally { stopFailure(); stopSuccess(); }
});

test('automatic refresh coalesces events and unsubscribed screens are skipped', async () => {
  let activeCalls = 0;
  let removedCalls = 0;
  const stop = subscribeRefresh(() => { activeCalls++; });
  const removed = subscribeRefresh(() => { removedCalls++; });
  removed();
  try {
    notifyRefresh(); notifyRefresh();
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(activeCalls, 1);
    assert.equal(removedCalls, 0);
  } finally { stop(); }
});
