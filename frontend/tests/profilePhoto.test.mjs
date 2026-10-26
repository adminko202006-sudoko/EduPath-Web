import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAccountPhoto } from '../src/services/profilePhoto.js';

test('navbar resolves existing applicant, staff and admin photo response shapes', () => {
  const base = 'http://192.168.1.5:8000';
  assert.equal(resolveAccountPhoto({ role: 'applicant', applicant: { profile_photo: 'profile_photos/me.png' } }, base), `${base}/storage/profile_photos/me.png`);
  assert.equal(resolveAccountPhoto({ role: 'staff', profile_photo: 'staff_profile_photos/me.png' }, base), `${base}/storage/staff_profile_photos/me.png`);
  assert.equal(resolveAccountPhoto({ role: 'admin', profile_photo_url: '/storage/admin.png' }, base), `${base}/storage/admin.png`);
  assert.equal(resolveAccountPhoto({ profile_photo_url: 'http://localhost:8000/storage/me.png' }, base), `${base}/storage/me.png`);
  assert.equal(resolveAccountPhoto({ profile_photo_url: 'https://cdn.example.test/me.png' }, base), 'https://cdn.example.test/me.png');
});

test('missing and unsupported photo values leave the navbar initials fallback available', () => {
  const base = 'http://localhost:8000';
  for (const photo of [null, '', 'javascript:alert(1)', 'data:text/html,test']) {
    assert.equal(resolveAccountPhoto({ profile_photo_url: photo }, base), null);
  }
  assert.equal(resolveAccountPhoto(null, base), null);
  assert.equal(resolveAccountPhoto({ profile_photo_url: 'storage/me.png' }, base), `${base}/storage/me.png`);
});

test('local Laravel storage URLs use the active API port on desktop and LAN', () => {
  const user = { role: 'admin', profile_photo_url: 'http://localhost/storage/admin_profile_photos/me.png' };
  for (const base of ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://192.168.1.5:8000']) {
    assert.equal(resolveAccountPhoto(user, base), `${base}/storage/admin_profile_photos/me.png`);
  }
  assert.equal(resolveAccountPhoto({ role: 'admin', profile_photo: 'admin_profile_photos/me.png' }, 'http://localhost:8000'), 'http://localhost:8000/storage/admin_profile_photos/me.png');
  assert.equal(resolveAccountPhoto({ profile_photo_url: 'https://cdn.example.test/me.png' }, 'http://localhost:8000'), 'https://cdn.example.test/me.png');
});
