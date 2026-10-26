import { useContext, useEffect, useRef } from 'react';

import { subscribeRefresh } from '../services/refreshBus';
import { RouteActivityContext } from '../context/routeActivityContext';
import { startVisibleRefresh } from '../services/visibleRefresh';

/**
 * Reload a screen's data automatically whenever the server reports a
 * change or when the browser tab becomes visible again. Hidden keep-alive
 * pages remember a pending refresh and run it once when revisited, so they
 * do not compete with the visible page for API requests.
 *
 * Usage:
 *   useAutoRefresh(() => {
 *     fetchThings(true); // `true` = silent refresh, no skeleton flash
 *   });
 *
 * The callback is stored in a ref, so it always uses the latest render's
 * closure (fresh token, filters, etc.) without resubscribing.
 */
const useAutoRefresh = (callback, intervalMs = 0) => {
  const callbackRef = useRef(callback);
  const dirtyRef = useRef(false);
  const isActive = useContext(RouteActivityContext);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!isActive || intervalMs <= 0) return;
    return startVisibleRefresh(() => callbackRef.current?.({ background: true }), intervalMs);
  }, [isActive, intervalMs]);

  useEffect(() => {
    let disposed = false;
    const refresh = (reason) => {
      if (!isActive) {
        dirtyRef.current = true;
        return;
      }
      dirtyRef.current = false;
      return callbackRef.current?.(reason);
    };
    const unsubscribe = subscribeRefresh(refresh);
    if (isActive && dirtyRef.current) {
      queueMicrotask(() => { if (!disposed && dirtyRef.current) refresh(); });
    }
    return () => { disposed = true; unsubscribe(); };
  }, [isActive]);
};

export default useAutoRefresh;
