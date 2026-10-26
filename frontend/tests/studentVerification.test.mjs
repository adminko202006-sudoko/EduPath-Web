import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { registrationPayload } from '../src/services/registrationPayload.js';

let server, IdentityFields, Register, Programs, Verification, AuthContext;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ default: IdentityFields } = await server.ssrLoadModule('/src/components/forms/StudentIdentityFields.jsx'));
  ({ default: Register } = await server.ssrLoadModule('/src/pages/auth/Register.jsx'));
  ({ default: Programs } = await server.ssrLoadModule('/src/pages/applicant/Programs.jsx'));
  ({ default: Verification } = await server.ssrLoadModule('/src/pages/applicant/Verification.jsx'));
  ({ AuthContext } = await server.ssrLoadModule('/src/context/authContextInstance.js'));
});
after(async () => { await server?.close(); });

const render = (Component, props = {}, auth = {}) => renderToStaticMarkup(createElement(MemoryRouter,
  {}, createElement(AuthContext.Provider, { value: auth }, createElement(Component, props))));

test('registration multipart preserves the ID binary and Philippine address structure', () => {
  const file = new File(['test-id'], 'id.png', { type: 'image/png' });
  const data = registrationPayload({ student_type: 'new', lrn: '001234567890', school_id: file,
    address_components: { country_code: 'PH', province_id: null, city: 'Trinidad', street: 'Test Street' } });
  assert.equal(data.get('lrn'), '001234567890');
  assert.equal(data.get('school_id').name, 'id.png');
  assert.equal(data.get('address_components[country_code]'), 'PH');
  assert.equal(data.get('address_components[city]'), 'Trinidad');
  assert.equal(data.has('address_components[province_id]'), false);
});

test('registration exposes all three types, fixed Philippines, LRN and private image upload', () => {
  const html = render(Register, {}, { register: async () => {} });
  for (const type of ['New student', 'Old student', 'Transferee']) assert.ok(html.includes(type));
  assert.match(html, /name="lrn"/);
  assert.match(html, /name="school_id"/);
  assert.match(html, /value="Philippines"/);
  assert.match(html, /Philippine addresses only/);
  assert.doesNotMatch(html, /Select country/);
});

test('old students supply their TMC number and cannot choose a program in registration', () => {
  const html = render(IdentityFields, { value: { student_type: 'old', previous_school: 'Trinidad Municipal College' }, onChange: () => {} });
  assert.match(html, /TMC student number/);
  assert.match(html, /administrator will confirm/);
  assert.doesNotMatch(html, /name="academic_program_id"/);
});

test('transferees provide previous college and receive the admission review instructions', () => {
  const html = render(IdentityFields, { value: { student_type: 'transferee' }, onChange: () => {} });
  assert.match(html, /Previous college \/ university/);
  assert.match(html, /transfer documents separately/);
  assert.doesNotMatch(html, /name="tmc_student_number"/);
});

test('old student program route renders only their administrator-confirmed program', () => {
  const html = render(Programs, {}, { verification: { identity: { student_type: 'old', academic_program: { name: 'Verified Program' } } } });
  assert.match(html, /My Program/); assert.match(html, /Verified Program/);
  assert.doesNotMatch(html, /<select|Search programs/);
});

test('unverified applicant sees both checks and no false successful email verification', () => {
  const html = render(Verification, {}, { verification: { email: 'student@example.test', email_verified: false, can_apply: false, identity: null }, refreshVerification: async () => {} });
  assert.match(html, /Applications are locked until both checks are complete/);
  assert.match(html, /Send \/ resend email code/);
  assert.match(html, /Email verification code/);
  assert.match(html, /Submit school identity for review/);
});
