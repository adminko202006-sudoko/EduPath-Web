// A recently visible signed-in client renews its presence every 30 seconds.
export function startPresenceHeartbeat(send, { window: win, document: doc, onError = () => {} }) {
  let stopped = false;
  let pending = false;
  const beat = async () => {
    if (stopped || pending || doc.visibilityState !== 'visible' || win.navigator?.onLine === false) return;
    pending = true;
    try { await send(); } catch (error) { if (!stopped) onError(error); }
    finally { pending = false; }
  };
  void beat();
  const timer = win.setInterval(beat, 30000);
  doc.addEventListener('visibilitychange', beat);
  win.addEventListener('online', beat);
  return () => { stopped = true; win.clearInterval(timer); doc.removeEventListener('visibilitychange', beat); win.removeEventListener('online', beat); };
}
