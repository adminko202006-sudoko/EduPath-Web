import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let server, Details;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ default: Details } = await server.ssrLoadModule('/src/components/ScholarshipApplicantDetails.jsx'));
});
after(async () => { await server?.close(); });

test('scholarship review lists every required file with its saved requirement name', () => {
  const html = renderToStaticMarkup(createElement(Details, { application: {
    id: 42,
    submitted_requirements: [{ index: 0, requirement: 'Grade slip', name: 'grades.pdf' }, { index: 1, requirement: 'Income certificate', name: 'income.png' }],
  } }));
  assert.match(html, /View Grade slip: grades.pdf/);
  assert.match(html, /View Income certificate: income.png/);
  assert.doesNotMatch(html, /scholarship-documents\//);
});

test('legacy scholarship attachments remain available', () => {
  const html = renderToStaticMarkup(createElement(Details, { application: { id: 9, supporting_document_name: 'old.pdf' } }));
  assert.match(html, /View attachment: old.pdf/);
});
