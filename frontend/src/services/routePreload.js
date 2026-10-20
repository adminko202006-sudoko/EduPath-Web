import { lazy } from 'react';

const routes = new Map();

// React.lazy and sidebar intent share one import, including concurrent hovers.
// A failed speculative import must not prevent a later navigation retry.
export function memoizePageImport(importPage) {
  let pending;
  return () => {
    if (!pending) {
      pending = Promise.resolve().then(importPage).catch((error) => {
        pending = undefined;
        throw error;
      });
    }
    return pending;
  };
}

export function lazyRoute(paths, importPage) {
  const load = memoizePageImport(importPage);
  for (const path of Array.isArray(paths) ? paths : [paths]) routes.set(path, load);
  return lazy(load);
}

export const canPreloadConnection = (connection) =>
  !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType);

export async function preloadRoute(path) {
  const connection = typeof navigator !== 'undefined' ? navigator.connection : null;
  if (!canPreloadConnection(connection) || typeof path !== 'string') return false;
  const load = routes.get(path.split(/[?#]/)[0]);
  if (!load) return false;
  try {
    await load();
    return true;
  } catch {
    // Only speculative code loading is optional. Actual navigation still uses
    // the existing error boundary and displays any loading failure to the user.
    return false;
  }
}

// Warm code only, one module at a time between interactions. No page is
// mounted and no applicant data is fetched by this speculative work.
export function scheduleRoutePreloads(paths, host = window) {
  const queue = [...new Set(paths)];
  let cancelled = false;
  let running = false;
  let timer;
  let idle;
  const cancelScheduled = () => {
    host.clearTimeout(timer);
    if (idle !== undefined) host.cancelIdleCallback?.(idle);
  };
  const schedule = () => {
    if (cancelled || running || !queue.length || host.document?.visibilityState === 'hidden'
      || !canPreloadConnection(host.navigator?.connection)) return;
    timer = host.setTimeout(() => {
      const run = async () => {
        if (cancelled || host.document?.visibilityState === 'hidden'
          || !canPreloadConnection(host.navigator?.connection)) return;
        running = true;
        try { await preloadRoute(queue.shift()); }
        finally { running = false; schedule(); }
      };
      if (host.requestIdleCallback) idle = host.requestIdleCallback(run, { timeout: 2000 });
      else void run();
    }, 300);
  };
  const resume = () => { cancelScheduled(); schedule(); };
  host.document?.addEventListener('visibilitychange', resume);
  host.navigator?.connection?.addEventListener?.('change', resume);
  schedule();
  return () => {
    cancelled = true;
    cancelScheduled();
    host.document?.removeEventListener('visibilitychange', resume);
    host.navigator?.connection?.removeEventListener?.('change', resume);
  };
}
