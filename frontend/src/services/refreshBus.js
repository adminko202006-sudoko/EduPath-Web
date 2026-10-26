/**
 * Tiny pub/sub that keeps mounted screens in sync with the server.
 *
 * `services/api.js` calls notifyRefresh() after every successful
 * create/update/delete request, and every screen subscribed through
 * `useAutoRefresh` refreshes visible pages and marks hidden cached pages
 * for one refresh when revisited. Because cached
 * (keep-alive) route components stay mounted, navigating back to a
 * visited screen shows fresh data too — no manual page refresh needed.
 *
 * Notifications are coalesced into a single flush per tick so a burst of
 * mutations (or many subscribed screens) still results in one refresh wave.
 */

const listeners = new Set();
let flushScheduled = false;

export const notifyRefresh = () => {
  if (flushScheduled || listeners.size === 0) return;

  flushScheduled = true;

  setTimeout(() => {
    flushScheduled = false;

    listeners.forEach((listener) => {
      try {
        Promise.resolve(listener()).catch(error => {
          console.error('Auto-refresh listener failed:', error);
        });
      } catch (error) {
        // One broken screen must not prevent the others from refreshing.
        console.error('Auto-refresh listener failed:', error);
      }
    });
  }, 0);
};

export const subscribeRefresh = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

// Explicit user refreshes can await subscribers without reloading the document.
let manualRefresh = null;
export const requestRefresh = () => {
  if (manualRefresh) return manualRefresh;
  manualRefresh = Promise.allSettled([...listeners].map(listener =>
    Promise.resolve().then(() => listener({ manual: true }))
  )).then(results => {
    const failure = results.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
  }).finally(() => { manualRefresh = null; });
  return manualRefresh;
};

// When the user comes back to the tab, re-sync open screens so changes
// made elsewhere (another user or session) appear without a manual reload.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      notifyRefresh();
    }
  });
}
