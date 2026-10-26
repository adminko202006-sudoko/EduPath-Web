import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let server, Picker;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ default: Picker } = await server.ssrLoadModule('/src/components/ScholarshipRequirementPicker.jsx'));
});
after(async () => { await server?.close(); });
const catalog = [
  { id: 1, name: 'School clearance', description: 'Clearance instructions', is_active: true },
  { id: 2, name: 'Inactive document', is_active: false },
  { id: 3, name: 'school clearance', is_active: true },
  { id: 4, name: 'Income certification', is_active: true },
];
function render(props = {}) {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Picker, {
    requirements: catalog, selected: [], onChange() {}, onRetry() {}, loading: false, error: '', ...props,
  })));
}

test('only active Requirement List entries become selectable, without custom or suggested options', () => {
  const html = render();
  assert.equal((html.match(/type="checkbox"/g) || []).length, 2);
  assert.match(html, /School clearance/);
  assert.match(html, /Income certification/);
  assert.match(html, /Clearance instructions/);
  assert.doesNotMatch(html, /Inactive document|Certificate of Enrollment|Add another requirement|type="text"/);
  assert.match(html, /href="\/admin\/requirements"/);
});

test('existing unavailable selections remain visible for deliberate removal and are not selectable options', () => {
  const html = render({ selected: ['School clearance', 'Old saved requirement'] });
  assert.equal((html.match(/type="checkbox"/g) || []).length, 2);
  assert.match(html, /checked=""/);
  assert.match(html, /Old saved requirement/);
  assert.match(html, /Remove saved requirement/);
});

test('loading and failure states never show stale selectable options', () => {
  const loading = render({ loading: true });
  assert.match(loading, /Loading Requirement List/);
  assert.doesNotMatch(loading, /type="checkbox"/);
  const failed = render({ error: 'Could not load requirements.' });
  assert.match(failed, /Could not load requirements/);
  assert.match(failed, /Retry Requirement List/);
  assert.doesNotMatch(failed, /type="checkbox"/);
});

test('an empty Requirement List does not inject default documents', () => {
  const html = render({ requirements: [] });
  assert.match(html, /No active requirements are available/);
  assert.doesNotMatch(html, /type="checkbox"/);
});
