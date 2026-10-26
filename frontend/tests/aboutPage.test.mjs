import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let server, About, AuthContext;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ default: About } = await server.ssrLoadModule('/src/pages/About.jsx'));
  ({ AuthContext } = await server.ssrLoadModule('/src/context/authContextInstance.js'));
});
after(async () => { await server?.close(); });

function page(role) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/about'] },
    createElement(AuthContext.Provider, { value: { user: role ? { role } : null } }, createElement(About))));
}

test('public About page explains EduPath and credits all five creators without old gallery images', () => {
  const html = page(null);
  for (const name of ['Oseas Jamora', 'Archie Corre', 'Jetro Ibaoc', 'Devid Caballero', 'Sharmyn Novela']) assert.ok(html.includes(name));
  assert.ok(html.includes('Lead Developer'));
  assert.match(html, /href="\/register"/);
  assert.match(html, /href="\/login"/);
  assert.match(html, /does not depict the creators/);
  assert.match(html, /<details>/);
  assert.doesNotMatch(html, /tmc-(campus|students|faculty|classroom|activities|community)\.jpg/);
  assert.doesNotMatch(html, /href="\/(admin|staff|applicant)\/dashboard"/);
});

for (const role of ['admin', 'staff', 'applicant']) {
  test(`${role} About page directs the account to its own dashboard`, () => {
    const html = page(role);
    assert.ok(html.includes(`href="/${role}/dashboard"`));
    assert.doesNotMatch(html, /href="\/register"/);
    if (role !== 'admin') assert.ok(html.includes(`href="/${role}/guide"`));
    else assert.doesNotMatch(html, /href="\/admin\/guide"/);
  });
}
