import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { memoizePageImport, lazyRoute, preloadRoute, canPreloadConnection, scheduleRoutePreloads } from '../src/services/routePreload.js';

test('concurrent intent and navigation share a single module import', async () => {
  let imports = 0;
  const module = { default: () => null };
  const load = memoizePageImport(async () => { imports++; return module; });
  const first = load();
  assert.equal(load(), first);
  assert.equal(await first, module);
  assert.equal(await load(), module);
  assert.equal(imports, 1);
});

test('a failed speculative import is retried instead of poisoning navigation', async () => {
  let imports = 0;
  const load = memoizePageImport(() => { if (++imports === 1) throw Error('Offline'); return { default: () => null }; });
  await assert.rejects(load(), /Offline/);
  assert.ok((await load()).default);
  assert.equal(imports, 2);
});

test('registered route aliases reuse code and query/hash do not create extra imports', async () => {
  let imports = 0;
  lazyRoute(['/preview/first', '/preview/alias'], async () => { imports++; return { default: () => null }; });
  assert.equal(await preloadRoute('/preview/first?filter=1#section'), true);
  assert.equal(await preloadRoute('/preview/alias'), true);
  assert.equal(await preloadRoute('/preview/missing'), false);
  assert.equal(await preloadRoute(null), false);
  assert.equal(imports, 1);
});

test('speculative failure is optional and a later attempt can succeed', async () => {
  let imports = 0;
  lazyRoute('/preview/retry', async () => { if (++imports === 1) throw Error('Offline'); return { default: () => null }; });
  assert.equal(await preloadRoute('/preview/retry'), false);
  assert.equal(await preloadRoute('/preview/retry'), true);
});

test('honors data saver and slow connections without disabling ordinary navigation', () => {
  assert.equal(canPreloadConnection({ saveData: true }), false);
  for (const effectiveType of ['slow-2g', '2g']) assert.equal(canPreloadConnection({ effectiveType }), false);
  for (const connection of [undefined, {}, { effectiveType: '4g' }]) assert.equal(canPreloadConnection(connection), true);
});

test('preload registrations match the actual route elements', () => {
  const source = fs.readFileSync(new URL('../src/routes/AppRoutes.jsx', import.meta.url), 'utf8');
  const definitions = [...source.matchAll(/const (\w+) = lazyRoute\((('[^']+')|(\[[^\]]+\])), \(\) => import\('([^']+)'\)\);/g)];
  assert.equal(definitions.length, 43);
  for (const [, name, paths] of definitions) {
    const registered = paths.startsWith('[') ? [...paths.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]) : [paths.slice(1, -1)];
    const actual = [...source.matchAll(new RegExp('path="([^"]+)"\\s+element=\\{<' + name + '\\s*/>\\}', 'g'))].map((match) => match[1]);
    assert.deepEqual([...new Set(actual)].sort(), [...registered].sort(), name);
  }
});

function idleHost() {
  let nextId = 0;
  const tasks = new Map();
  const document = new EventTarget();
  document.visibilityState = 'visible';
  return {
    document, navigator: { connection: {} }, tasks,
    setTimeout(callback) { tasks.set(++nextId, callback); return nextId; },
    clearTimeout(id) { tasks.delete(id); },
    async tick() {
      const task = tasks.entries().next().value;
      if (!task) return;
      tasks.delete(task[0]);
      task[1]();
      // Drain the import promise chain before examining the next idle task.
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

test('idle warming loads each selected route once and stops after cleanup', async () => {
  const loaded = [];
  for (const name of ['first', 'second', 'third']) lazyRoute(`/warm/${name}`, async () => { loaded.push(name); return { default: () => null }; });
  const host = idleHost();
  const cancel = scheduleRoutePreloads(['/warm/first', '/warm/first', '/warm/second', '/warm/third'], host);
  assert.deepEqual(loaded, []);
  await host.tick();
  assert.deepEqual(loaded, ['first']);
  await host.tick();
  assert.deepEqual(loaded, ['first', 'second']);
  cancel();
  await host.tick();
  assert.deepEqual(loaded, ['first', 'second']);
});

test('idle warming pauses in hidden tabs and resumes when visible', async () => {
  let loaded = 0;
  lazyRoute('/warm/visible', async () => { loaded++; return { default: () => null }; });
  const host = idleHost();
  host.document.visibilityState = 'hidden';
  const cancel = scheduleRoutePreloads(['/warm/visible'], host);
  await host.tick();
  assert.equal(loaded, 0);
  host.document.visibilityState = 'visible';
  host.document.dispatchEvent(new Event('visibilitychange'));
  await host.tick();
  assert.equal(loaded, 1);
  cancel();
});

test('idle warming does not schedule downloads on a data-saving connection', () => {
  const host = idleHost();
  host.navigator.connection.saveData = true;
  const cancel = scheduleRoutePreloads(['/warm/not-downloaded'], host);
  assert.equal(host.tasks.size, 0);
  cancel();
});
