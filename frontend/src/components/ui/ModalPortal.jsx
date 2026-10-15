import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/* =========================================================
   MODAL PORTAL
   Renders dialog markup directly on <body> so that:

   - The overlay is always positioned against the real viewport
     (no transformed ancestor — e.g. `.page-transition` — can turn
     `position: fixed` into page-relative positioning).
   - Background scrolling is locked while any dialog is open, even
     though the app scrolls inside <main> rather than <body>.
   - Keyboard focus enters the dialog, stays trapped inside it,
     and is restored to the trigger element on close.
   - Escape only affects the topmost dialog, so nested dialogs
     (e.g. a confirm on top of a form modal) behave predictably.
   ========================================================= */

/* =========================================================
   BACKGROUND SCROLL LOCK (reference-counted)
   Multiple stacked dialogs share a single lock; the previous
   inline styles are restored only when the last one closes, and
   the page's scroll position is never reset.
   ========================================================= */

let scrollLockCount = 0;
const savedOverflow = { html: '', body: '' };
let savedBodyPaddingRight = '';

const lockPageScroll = () => {
  scrollLockCount += 1;

  if (scrollLockCount > 1) return;

  const { documentElement, body } = document;

  savedOverflow.html = documentElement.style.overflow;
  savedOverflow.body = body.style.overflow;
  savedBodyPaddingRight = body.style.paddingRight;

  const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

  documentElement.style.overflow = 'hidden';
  body.style.overflow = 'hidden';

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
};

const unlockPageScroll = () => {
  scrollLockCount = Math.max(0, scrollLockCount - 1);

  if (scrollLockCount > 0) return;

  document.documentElement.style.overflow = savedOverflow.html;
  document.body.style.overflow = savedOverflow.body;
  document.body.style.paddingRight = savedBodyPaddingRight;
};

/* =========================================================
   FOCUS HELPERS
   ========================================================= */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

const isVisible = (element) =>
  element.getClientRects().length > 0;

const getFocusableElements = (root) => {
  if (!root || typeof root.querySelectorAll !== 'function') return [];

  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => isVisible(element) && element.getAttribute('aria-hidden') !== 'true'
  );
};

const focusElement = (element) => {
  if (!element || typeof element.focus !== 'function') return;

  if (element === document.body && !element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
  }

  element.focus({ preventScroll: true });
};

/* Only the most recently opened dialog reacts to Escape/Tab so
   stacked dialogs never fight over the keyboard. */
const dialogStack = [];

/* =========================================================
   COMPONENT
   ========================================================= */

const ModalPortal = ({ children, onEscape }) => {
  const containerRef = useRef(null);
  const onEscapeRef = useRef(onEscape);

  // Keep the latest callback without re-running the mount effect.
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    const instance = {};
    dialogStack.push(instance);

    lockPageScroll();

    const previouslyFocused =
      document.activeElement && document.activeElement !== document.body
        ? document.activeElement
        : null;

    const focusFrame = window.requestAnimationFrame(() => {
      const container = containerRef.current;

      if (!container) return;

      const dialog =
        container.querySelector('[role="dialog"]') || container.firstElementChild;

      if (dialog && !dialog.hasAttribute('tabindex')) {
        dialog.setAttribute('tabindex', '-1');
      }

      focusElement(dialog);
    });

    const handleKeyDown = (event) => {
      if (dialogStack[dialogStack.length - 1] !== instance) return;
      if (event.defaultPrevented) return;

      if (event.key === 'Escape') {
        onEscapeRef.current?.(event);
        return;
      }

      if (event.key !== 'Tab') return;

      const container = containerRef.current;

      if (!container) return;

      const dialog =
        container.querySelector('[role="dialog"]') || container;

      const focusable = getFocusableElements(dialog);

      if (focusable.length === 0) {
        event.preventDefault();
        focusElement(dialog);
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const activeInside = dialog.contains(active);

      if (event.shiftKey) {
        if (!activeInside || active === first || active === dialog) {
          event.preventDefault();
          focusElement(last);
        }
      } else if (!activeInside || active === last) {
        event.preventDefault();
        focusElement(first);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);

      const index = dialogStack.indexOf(instance);
      if (index !== -1) dialogStack.splice(index, 1);

      unlockPageScroll();

      if (previouslyFocused && previouslyFocused.isConnected) {
        focusElement(previouslyFocused);
      }
    };
  }, []);

  // `display: contents` keeps the children' DOM structure untouched
  // while giving us an element to query for the dialog subtree.
  return createPortal(
    <div ref={containerRef} style={{ display: 'contents' }}>
      {children}
    </div>,
    document.body
  );
};

export default ModalPortal;
