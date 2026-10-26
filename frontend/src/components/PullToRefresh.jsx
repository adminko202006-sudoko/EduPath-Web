import { useEffect, useRef, useState } from 'react';
import { ArrowDown, LoaderCircle } from 'lucide-react';
import { requestRefresh } from '../services/refreshBus';
import { canStartPull, pullDistance, PULL_THRESHOLD } from '../services/pullRefreshGesture';

export default function PullToRefresh() {
  const hint = useRef(null);
  const busy = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const root = hint.current.closest('main');
    let start = null;
    let distance = 0;
    let disposed = false;
    const interactiveSelector = 'button,a,input,textarea,select,label,[contenteditable="true"],[role="dialog"],[role="slider"],[data-no-pull-refresh]';
    const reset = () => { start = null; distance = 0; if (!disposed) setDistance(0); };
    const refresh = async () => {
      if (busy.current) return;
      busy.current = true;
      setRefreshing(true);
      setError('');
      try {
        await Promise.all([requestRefresh(), new Promise(resolve => setTimeout(resolve, 400))]);
      } catch {
        if (!disposed) setError('Could not refresh. Check your connection and pull down to try again.');
      } finally {
        busy.current = false;
        if (!disposed) setRefreshing(false);
      }
    };
    const begin = (point, target) => {
      const rect = root.getBoundingClientRect();
      if (!canStartPull({
        scrollTop: root.scrollTop, offsetY: point.clientY - rect.top,
        interactive: Boolean(target.closest(interactiveSelector)), busy: busy.current,
        modalOpen: Boolean(document.querySelector('[role="dialog"], [aria-modal="true"]')),
      })) return;
      // A nested scroll area must handle its own scrolling.
      for (let node = target; node && node !== root; node = node.parentElement) {
        if (node.scrollHeight > node.clientHeight && /auto|scroll/.test(getComputedStyle(node).overflowY)) return;
      }
      start = { x: point.clientX, y: point.clientY };
    };
    const move = (point, event) => {
      if (!start) return;
      if (root.scrollTop > 0 || point.clientY < start.y || Math.abs(point.clientX - start.x) > Math.max(12, point.clientY - start.y)) { reset(); return; }
      distance = pullDistance(start, { x: point.clientX, y: point.clientY });
      if (distance > 4 && event.cancelable) event.preventDefault();
      setDistance(distance);
    };
    const finish = () => {
      const ready = start && distance >= PULL_THRESHOLD;
      reset();
      if (ready) void refresh();
    };
    const mouseDown = event => { if (event.button === 0) begin(event, event.target); };
    const mouseMove = event => { if (event.buttons !== 1) reset(); else move(event, event); };
    const touchStart = event => { if (event.touches.length === 1) begin(event.touches[0], event.target); else reset(); };
    const touchMove = event => { if (event.touches.length === 1) move(event.touches[0], event); else reset(); };
    const keyDown = event => {
      if (event.key === 'Enter' && event.target === hint.current) { event.preventDefault(); void refresh(); }
      if (event.key === 'Escape') reset();
    };
    root.addEventListener('mousedown', mouseDown);
    root.addEventListener('touchstart', touchStart, { passive: true });
    root.addEventListener('touchmove', touchMove, { passive: false });
    root.addEventListener('touchend', finish);
    root.addEventListener('touchcancel', reset);
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', finish);
    window.addEventListener('blur', reset);
    root.addEventListener('keydown', keyDown);
    return () => {
      disposed = true;
      root.removeEventListener('mousedown', mouseDown);
      root.removeEventListener('touchstart', touchStart);
      root.removeEventListener('touchmove', touchMove);
      root.removeEventListener('touchend', finish);
      root.removeEventListener('touchcancel', reset);
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', finish);
      window.removeEventListener('blur', reset);
      root.removeEventListener('keydown', keyDown);
    };
  }, []);

  return <div ref={hint} tabIndex={0} aria-label="Refresh page data. Pull down from the top, or press Enter here."
    className="relative z-10 mx-auto flex min-h-8 w-fit max-w-full select-none items-center justify-center gap-2 rounded-lg px-3 text-center text-xs text-slate-500 outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#F4B400] dark:text-slate-400">
    {refreshing ? <LoaderCircle size={14} className="animate-spin" /> : <ArrowDown size={14} style={{ transform: `rotate(${distance >= PULL_THRESHOLD ? 180 : 0}deg)` }} />}
    <span role="status" aria-live="polite">{refreshing ? 'Refreshing data…' : distance >= PULL_THRESHOLD ? 'Release to refresh' : distance > 0 ? 'Keep pulling down…' : 'Pull down from the top to refresh'}</span>
    {error && <span role="alert" className="text-red-600 dark:text-red-400">{error}</span>}
  </div>;
}
