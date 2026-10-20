import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreSession } from '../src/services/sessionRecovery.js';

test('no saved token skips the user request', async () => {
  const result = await restoreSession(null, () => { throw new Error('Must not request a session'); });
  assert.deepEqual(result, { status: 'anonymous', user: null });
});

for (const role of ['admin', 'staff', 'applicant']) {
  test(`restores a server-verified ${role} identity`, async () => {
    const user = { id: 1, role, name: 'Test user' };
    const result = await restoreSession('test-token', async (token) => {
      assert.equal(token, 'test-token');
      return { success: true, data: user };
    });
    assert.deepEqual(result, { status: 'authenticated', user });
  });
}

for (const status of [undefined, 403, 429, 500, 503]) {
  test(`withholds identity and allows retry for ${status ?? 'network failure'}`, async () => {
    const result = await restoreSession('test-token', async () => {
      throw Object.assign(new Error('Private server diagnostic'), { response: status ? { status } : undefined });
    });
    assert.deepEqual(result, { status: 'unavailable', user: null });
  });
}

test('only a 401 response marks the saved token expired', async () => {
  const result = await restoreSession('test-token', async () => { throw { response: { status: 401 } }; });
  assert.deepEqual(result, { status: 'expired', user: null });
});

test('malformed or unsupported identities never unlock protected routes', async () => {
  for (const response of [null, {}, { data: [] }, { success: false, data: { id: 1, role: 'admin' } }, { data: { id: 1, role: 'superadmin' } }, { data: { role: 'admin' } }]) {
    assert.deepEqual(await restoreSession('test-token', async () => response), { status: 'unavailable', user: null });
  }
});

test('an interrupted lookup can recover on the next attempt', async () => {
  let calls = 0;
  const getUser = async () => {
    if (++calls === 1) throw new Error('Offline');
    return { data: { id: 7, role: 'applicant' } };
  };
  assert.equal((await restoreSession('same-token', getUser)).status, 'unavailable');
  assert.equal((await restoreSession('same-token', getUser)).status, 'authenticated');
});
