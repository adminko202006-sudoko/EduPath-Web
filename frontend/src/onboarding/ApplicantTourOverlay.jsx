import ErrorMessage from '../components/ui/ErrorMessage';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { guideImage } from './applicantTour';
import { panelPosition, spotlightRect, visibleTarget } from './tourGeometry';

const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';

export default function ApplicantTourOverlay({ step, index, pathname, busy, error, setMobileMenuOpen, onBack, onNext, onSkip, onFinish, onClose }) {
  const panelRef = useRef(null);
  const targetRef = useRef(null);
  const callbacks = useRef({ onClose });
  const [geometry, setGeometry] = useState(null);
  const [missing, setMissing] = useState(false);
  const [retry, setRetry] = useState(0);
  const [failedImage, setFailedImage] = useState('');
  const profilePending = step.id === 'profile' && pathname !== step.path;

  useEffect(() => { callbacks.current = { onClose }; });

  useEffect(() => {
    const previousFocus = document.activeElement;
    const savedScroll = Array.from(document.querySelectorAll('main, aside, aside div')).filter((node) => node.scrollHeight > node.clientHeight).map((node) => [node, node.scrollTop]);
    const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); callbacks.current.onClose(); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panelRef.current?.querySelectorAll(focusable) || []).filter((node) => node.getClientRects().length);
      const target = targetRef.current;
      if (target?.matches('a[href],button') && target.getClientRects().length) controls.push(target);
      if (!controls.length) return;
      const current = controls.indexOf(document.activeElement);
      event.preventDefault();
      const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0) : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      controls[next].focus({ preventScroll: true });
    };
    const handleFocus = (event) => {
      if (!panelRef.current?.contains(event.target) && event.target !== targetRef.current && !document.querySelector('[aria-modal="true"]')) panelRef.current?.focus({ preventScroll: true });
    };
    const checkModal = () => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) callbacks.current.onClose();
    };
    const modalObserver = new MutationObserver(checkModal);
    modalObserver.observe(document.body, { childList: true, subtree: true });
    checkModal();
    document.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', handleFocus);
    return () => {
      cancelAnimationFrame(frame);
      modalObserver.disconnect();
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('focusin', handleFocus);
      savedScroll.forEach(([node, top]) => { if (node.isConnected) node.scrollTop = top; });
      // A newly opened real modal owns focus; do not take it back.
      queueMicrotask(() => { if (!document.querySelector('[aria-modal="true"]')) {
        const destination = previousFocus?.isConnected && previousFocus.getClientRects().length ? previousFocus : document.querySelector('#main-content');
        const needsTabIndex = destination && !destination.hasAttribute('tabindex') && destination.tagName === 'MAIN';
        if (needsTabIndex) destination.setAttribute('tabindex', '-1');
        destination?.focus({ preventScroll: true });
        if (needsTabIndex) destination.removeAttribute('tabindex');
      } });
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let scrolledTarget = null;
    let deadline = Date.now() + 10000;
    const focusFrame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    let resizeObserver;
    let yieldedToModal = false;
    const inertChanges = new Map();
    const restoreInert = () => { inertChanges.forEach((value, node) => { node.inert = value; }); inertChanges.clear(); };
    const isolate = (target) => {
      if (yieldedToModal) return;
      restoreInert();
      const portal = panelRef.current?.parentElement;
      const walk = (parent) => {
        for (const child of parent.children) {
          if (child === portal || child === target) continue;
          if (child.contains(portal) || (target && child.contains(target))) walk(child);
          else if (child instanceof HTMLElement && !['SCRIPT', 'STYLE'].includes(child.tagName)) { inertChanges.set(child, child.inert); child.inert = true; }
        }
      };
      walk(document.body);
    };
    const yieldToModal = () => { yieldedToModal = true; restoreInert(); callbacks.current.onClose(); };
    window.addEventListener('edupath:modal-opening', yieldToModal);
    if (step.nav) setMobileMenuOpen(true);
    else setMobileMenuOpen(false);

    const measure = () => {
      frame = 0;
      if (disposed || !panelRef.current) return;
      const mobile = window.innerWidth < 1024;
      const intro = visibleTarget(`applicant-${step.id}-intro`);
      const pageReady = profilePending || (pathname === step.path && intro && !intro.closest('[aria-busy="true"]'));
      const wanted = step.nav ? `applicant-nav-${step.nav}` : step.id === 'finish' ? 'applicant-tutorial-restart' : 'applicant-welcome-intro';
      const target = pageReady ? visibleTarget(wanted) : null;
      const vp = window.visualViewport;
      const width = vp?.width || window.innerWidth;
      const height = vp?.height || window.innerHeight;
      const offsetLeft = vp?.offsetLeft || 0;
      const offsetTop = vp?.offsetTop || 0;
      if (target && scrolledTarget !== target) {
        // Put mobile sidebar links near the top, reserving room for the guide below.
        const scrollArea = target.closest('aside')?.querySelector('.overflow-y-auto');
        if (mobile && scrollArea) scrollArea.scrollTop += target.getBoundingClientRect().top - scrollArea.getBoundingClientRect().top;
        else target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        scrolledTarget = target;
        resizeObserver?.observe(target);
      }
      const targetRect = target?.getBoundingClientRect();
      const adjusted = targetRect ? { left: targetRect.left - offsetLeft, top: targetRect.top - offsetTop, right: targetRect.right - offsetLeft, bottom: targetRect.bottom - offsetTop } : null;
      let rect = spotlightRect(adjusted, width, height);
      const offscreen = Boolean(target && !rect);
      const panelWidth = Math.min(460, width - 24);
      const panelHeight = Math.min(panelRef.current.offsetHeight, height - 24);
      let position = panelPosition(rect, width, height, panelWidth, panelHeight);
      const timedOut = !target && Date.now() >= deadline;
      // If the screen cannot fit both, keep a usable guide and remove target interaction.
      const noRoom = Boolean(position.overlaps);
      if (noRoom || timedOut) {
        rect = null;
        position = panelPosition(null, width, height, panelWidth, panelHeight);
      }
      const interactive = rect && step.nav ? target : null;
      if (targetRef.current !== interactive || !inertChanges.size) isolate(interactive);
      targetRef.current = interactive;
      setMissing(timedOut || noRoom || offscreen);
      setGeometry({ rect, position, width, height, offsetLeft, offsetTop });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    resizeObserver = new ResizeObserver(schedule);
    if (panelRef.current) resizeObserver.observe(panelRef.current);
    const observer = new MutationObserver(schedule);
    // Do not observe the tour portal: its own positioning would create a loop.
    const appRoot = document.getElementById('root');
    if (appRoot) observer.observe(appRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'aria-busy', 'data-tutorial-target'] });
    const interval = setInterval(schedule, 250);
    window.addEventListener('resize', schedule);
    document.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    schedule();
    return () => {
      disposed = true;
      deadline = 0;
      clearInterval(interval);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', schedule);
      document.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('edupath:modal-opening', yieldToModal);
      restoreInert();
      targetRef.current = null;
    };
  }, [step, pathname, profilePending, retry, setMobileMenuOpen]);

  const rect = geometry?.rect;
  const position = geometry?.position;
  const image = guideImage(step, rect, position);
  const blockers = rect ? [
    { left: 0, top: 0, width: '100%', height: rect.top },
    { left: 0, top: rect.bottom, width: '100%', bottom: 0 },
    { left: 0, top: rect.top, width: rect.left, height: rect.height },
    { left: rect.right, right: 0, top: rect.top, height: rect.height },
  ] : [{ inset: 0 }];

  return createPortal(
    <div className="ep-tour-layer" style={geometry ? { left: geometry.offsetLeft, top: geometry.offsetTop, width: geometry.width, height: geometry.height } : undefined}>
      {blockers.map((style, i) => <div key={i} className="ep-tour-shade" style={style} aria-hidden="true" />)}
      {rect && <div className="ep-tour-spotlight" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} aria-hidden="true" />}
      <section ref={panelRef} className="ep-tour-panel" style={position ? { left: position.left, top: position.top, width: position.width } : undefined} role="dialog" aria-modal="false" aria-labelledby="ep-tour-title" aria-describedby="ep-tour-copy" tabIndex={-1}>
        <div className="ep-tour-speech">
          <button type="button" className="ep-tour-close" disabled={busy} onClick={onClose} aria-label="Close tutorial and resume later"><X size={20} /></button>
          <p className="ep-tour-progress" aria-live="polite">Step {index + 1} of 8</p>
          <div className="ep-tour-track" aria-hidden="true">{Array.from({ length: 8 }, (_, segment) => <span key={segment} className={segment <= index ? 'is-complete' : ''} />)}</div>
          <h2 id="ep-tour-title">{step.title}</h2>
          <p id="ep-tour-copy">{step.text}</p>
          {missing && <div className="ep-tour-status"><p>The highlight is unavailable here. You can still continue.</p><button type="button" disabled={busy} onClick={() => setRetry((value) => value + 1)}>Retry highlight</button></div>}
          {error && <ErrorMessage message={error}><p role="alert" className="ep-tour-error">{error} Retry using the same control, or close and resume later.</p></ErrorMessage>}
        </div>
        <div className="ep-tour-guide-footer">
          <div className="ep-tour-character-stage" aria-hidden="true">
            <Sparkles className="ep-tour-sparkle" size={17} />
            {failedImage !== image ? <img key={image} className="ep-tour-character" src={`/images/onboarding/${image}`} alt="" onError={() => setFailedImage(image)} /> : <span className="ep-tour-character-fallback">EduPath<br />Guide</span>}
          </div>
          <div className="ep-tour-actions">
            <button type="button" className="ep-tour-primary" disabled={busy} aria-busy={busy} onClick={index === 7 ? onFinish : onNext}><span>{index === 7 ? 'Finish' : profilePending ? 'Open My Profile' : 'Next'}</span>{index === 7 ? <Check size={18} /> : <ArrowRight size={18} />}</button>
            <div className="ep-tour-secondary"><button type="button" disabled={busy || index === 0} onClick={onBack}>Back</button><button type="button" disabled={busy} onClick={onSkip}>Skip</button></div>
          </div>
        </div>
        {failedImage === image && <p role="status" className="ep-tour-asset-error">The guide image could not load. The tour controls are still available.</p>}
      </section>
    </div>, document.body,
  );
}
