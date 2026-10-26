import test from 'node:test';
import assert from 'node:assert/strict';
import { createInFlightAdapter } from '../src/services/inFlightRequests.js';

const key = (config) => JSON.stringify([config.url, config.token, config.params]);
const config = (extra = {}) => ({ method: 'get', url: '/programs', token: 'account-a', ...extra });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test('concurrent identical reads use one transport; completed reads are fetched again', async () => {
  let calls = 0;
  const gate = deferred();
  const adapter = createInFlightAdapter(async () => { calls++; await gate.promise; return { data: 'fresh' }; }, key);
  const firstConfig = config(), secondConfig = config();
  const first = adapter(firstConfig), second = adapter(secondConfig);
  await Promise.resolve();
  assert.equal(calls, 1);
  gate.resolve();
  const responses = await Promise.all([first, second]);
  assert.equal(responses[0].config, firstConfig);
  assert.equal(responses[1].config, secondConfig);
  await adapter(config());
  assert.equal(calls, 2);
});

test('accounts and filters never share a read', async () => {
  let calls = 0;
  const adapter = createInFlightAdapter(async () => { calls++; return { data: 'fresh' }; }, key);
  await Promise.all([adapter(config()), adapter(config({ token: 'account-b' })), adapter(config({ params: { page: 2 } }))]);
  assert.equal(calls, 3);
});

test('failed reads reach every caller and a later retry uses the transport', async () => {
  let calls = 0;
  const adapter = createInFlightAdapter(async () => { calls++; if (calls === 1) throw Error('Network unavailable'); return { data: 'recovered' }; }, key);
  const responses = await Promise.allSettled([adapter(config()), adapter(config())]);
  assert.ok(responses.every((response) => response.status === 'rejected' && response.reason.message === 'Network unavailable'));
  assert.equal(calls, 1);
  assert.equal((await adapter(config())).data, 'recovered');
  assert.equal(calls, 2);
});

test('cancellable requests, authentication and examination clocks are never combined', async () => {
  let calls = 0;
  const adapter = createInFlightAdapter(async () => { calls++; return { data: 'fresh' }; }, key);
  for (const extra of [{ signal: new AbortController().signal }, { url: '/auth/user' }, { url: '/applicant/online-exam/attempt' }, { dedupe: false }]) {
    await Promise.all([adapter(config(extra)), adapter(config(extra))]);
  }
  assert.equal(calls, 8);
});

test('writes invalidate reads both when they start and when they finish', async () => {
  let calls = 0;
  const reads = deferred(), write = deferred();
  const adapter = createInFlightAdapter(async (request) => {
    calls++;
    await (request.method === 'get' ? reads.promise : write.promise);
    return { data: 'fresh' };
  }, key);
  const oldRead = adapter(config());
  const update = adapter(config({ method: 'put' }));
  const midRead = adapter(config());
  write.resolve();
  await update;
  const newRead = adapter(config());
  reads.resolve();
  await Promise.all([oldRead, midRead, newRead]);
  assert.equal(calls, 4);
});
