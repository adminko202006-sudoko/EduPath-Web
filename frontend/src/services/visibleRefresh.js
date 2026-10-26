/** Poll only the visible online page, without overlapping refresh requests. */
export function startVisibleRefresh(refresh, intervalMs, {
  window: win = globalThis.window,
  document: doc = globalThis.document,
  onError = (error) => console.error('Background refresh failed:', error),
} = {}) {
  let stopped = false;
  let pending = false;
  const tick = async () => {
    if (stopped || pending || doc.visibilityState !== 'visible' || win.navigator?.onLine === false) return;
    pending = true;
    try { await refresh(); }
    catch (error) { onError(error); }
    finally { pending = false; }
  };
  const timer = win.setInterval(tick, intervalMs);
  return () => { stopped = true; win.clearInterval(timer); };
}
