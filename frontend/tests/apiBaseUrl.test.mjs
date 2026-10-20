import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBaseUrl } from '../src/services/apiBaseUrl.js';

test('production uses the same HTTPS origin, without a development port', () => {
  assert.equal(resolveApiBaseUrl({ production: true, origin: 'https://edupath.example' }), 'https://edupath.example/api');
  assert.equal(resolveApiBaseUrl({ production: true, origin: 'https://edupath.example', configured: '/api/' }), 'https://edupath.example/api');
});
test('a separate HTTPS API host can be configured', () => {
  assert.equal(resolveApiBaseUrl({ production: true, origin: 'https://edupath.example', configured: ' https://api.edupath.example/api/ ' }), 'https://api.edupath.example/api');
});
test('production rejects HTTP and URLs containing credentials or secrets', () => {
  for (const configured of ['http://192.168.1.6:8000/api', 'https://user:secret@college.example/api', 'https://college.example/api?token=secret', 'https://college.example/api#secret']) {
    assert.throws(() => resolveApiBaseUrl({ production: true, configured }));
  }
});
test('local development keeps the current LAN and explicit override behavior', () => {
  assert.equal(resolveApiBaseUrl({ hostname: '192.168.1.6' }), 'http://192.168.1.6:8000/api');
  assert.equal(resolveApiBaseUrl({ configured: 'http://localhost:8001/api/' }), 'http://localhost:8001/api');
});
