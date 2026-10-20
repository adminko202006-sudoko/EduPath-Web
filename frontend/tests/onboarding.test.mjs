import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { TOUR_STEPS, guideImage, isExamRoute, stepIndex } from '../src/onboarding/applicantTour.js';
import { panelPosition, spotlightRect, visibleTarget } from '../src/onboarding/tourGeometry.js';

test('tour destinations are real applicant routes and exclude examination and submission actions', () => {
  const routes = readFileSync(new URL('../src/routes/AppRoutes.jsx', import.meta.url), 'utf8');
  assert.equal(TOUR_STEPS.length, 8);
  assert.equal(new Set(TOUR_STEPS.map((s) => s.id)).size, 8);
  for (const step of TOUR_STEPS) {
    assert.ok(routes.includes(`path="${step.path}"`));
    assert.ok(!/exam|apply|submit/.test(step.path));
  }
  assert.equal(stepIndex('documents'), 4);
  assert.equal(stepIndex('unknown-version-step'), 0);
});

test('character uses supplied public assets and points toward the target', () => {
  for (const name of ['welcome.png', 'explain.png', 'point-left.png', 'point-right.png', 'celebrate.png']) {
    assert.ok(existsSync(new URL(`../public/images/onboarding/${name}`, import.meta.url)));
  }
  assert.equal(guideImage(TOUR_STEPS[0]), 'welcome.png');
  assert.equal(guideImage(TOUR_STEPS[7]), 'celebrate.png');
  assert.equal(guideImage(TOUR_STEPS[2]), 'explain.png');
  assert.equal(guideImage(TOUR_STEPS[2], { left: 0, width: 100 }, { left: 400, width: 300 }), 'point-left.png');
  assert.equal(guideImage(TOUR_STEPS[2], { left: 600, width: 100 }, { left: 0, width: 300 }), 'point-right.png');
});

test('spotlight clips to viewport and rejects fully offscreen targets', () => {
  assert.deepEqual(spotlightRect({ left: -10, top: -20, right: 150, bottom: 60 }, 320, 640), { left: 0, top: 0, right: 156, bottom: 66, width: 156, height: 66 });
  assert.equal(spotlightRect({ left: -200, top: 20, right: -100, bottom: 60 }, 320, 640), null);
});

test('guide fits desktop and mobile and avoids highlighted navigation where possible', () => {
  const target = { left: 12, top: 160, right: 274, bottom: 208 };
  for (const [width, height, panelWidth, panelHeight] of [[1440, 900, 410, 320], [390, 844, 366, 330], [320, 640, 296, 340]]) {
    const pos = panelPosition(target, width, height, panelWidth, panelHeight);
    assert.ok(pos.left >= 0 && pos.left + panelWidth <= width);
    assert.ok(pos.top >= 0 && pos.top + panelHeight <= height);
    assert.equal(pos.overlaps, false);
  }
  assert.equal(panelPosition({ left: 0, top: 0, right: 320, bottom: 500 }, 320, 568, 296, 340).overlaps, true);
});

test('active exam route including nested URLs is excluded without blocking scheduled exam information', () => {
  assert.equal(isExamRoute('/applicant/online-scholarship-exam'), true);
  assert.equal(isExamRoute('/applicant/online-scholarship-exam/attempt'), true);
  assert.equal(isExamRoute('/applicant/exams'), false);
});

test('target lookup excludes hidden keep-alive pages', () => {
  const savedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({ visibility: 'visible' });
  try {
    const hidden = { getClientRects: () => [], getBoundingClientRect: () => ({ width: 100, height: 20 }) };
    const visible = { getClientRects: () => [{}], getBoundingClientRect: () => ({ width: 100, height: 20 }) };
    assert.equal(visibleTarget('example', { querySelectorAll: () => [hidden, visible] }), visible);
    assert.equal(visibleTarget('example', { querySelectorAll: () => [hidden] }), null);
  } finally { globalThis.getComputedStyle = savedStyle; }
});
