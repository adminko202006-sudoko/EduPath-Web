import test from 'node:test';
import assert from 'node:assert/strict';
import { createErrorDialogStore } from '../src/services/errorDialogs.js';

test('queues different errors in order and acknowledges duplicate messages together', () => {
  const store = createErrorDialogStore();
  store.publish('form', 'Upload failed', 'retry button');
  store.publish('page', 'Upload failed');
  store.publish('other', 'Unable to load programs');
  assert.equal(store.getSnapshot()[0].content, 'retry button');
  store.dismiss('form');
  assert.deepEqual(store.getSnapshot().map(item => item.message), ['Unable to load programs']);
});

test('rerendering a dismissed error does not reopen it; a changed or retried failure does', () => {
  const store = createErrorDialogStore();
  store.publish('form', 'Save failed');
  store.dismiss('form');
  store.publish('form', 'Save failed', 'updated retry control');
  assert.equal(store.getSnapshot().length, 0);
  store.reopen('form');
  assert.equal(store.getSnapshot()[0].content, 'updated retry control');
  store.dismiss('form');
  store.publish('form', 'Session expired');
  assert.equal(store.getSnapshot()[0].message, 'Session expired');
  store.remove('form');
  store.publish('form', 'Session expired');
  assert.equal(store.getSnapshot().length, 1);
});

test('unmounted pages remove queued errors and imperative failures remain until acknowledged', () => {
  const store = createErrorDialogStore();
  store.publish('page', 'Failed to load');
  store.show('Unable to save');
  store.remove('page');
  assert.equal(store.getSnapshot()[0].message, 'Unable to save');
  store.dismiss(store.getSnapshot()[0].id);
  assert.deepEqual(store.getSnapshot(), []);
});

test('subscribers are notified and snapshots remain stable between changes', () => {
  const store = createErrorDialogStore();
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  const initial = store.getSnapshot();
  assert.equal(initial, store.getSnapshot());
  store.publish('field', 'Required');
  assert.equal(updates, 1);
  unsubscribe();
  store.dismiss('field');
  assert.equal(updates, 1);
});

test('clearing an error removes it even when its component stays mounted', () => {
  const store = createErrorDialogStore();
  store.publish('form', 'Invalid input');
  store.publish('form', '');
  assert.deepEqual(store.getSnapshot(), []);
});
