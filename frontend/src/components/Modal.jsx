import { X } from 'lucide-react';
import ModalPortal from './ui/ModalPortal';

const Modal = ({
  open = false,
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'max-w-xl',
  closeOnBackdrop = true,
  showCloseButton = true,
}) => {
  const visible = isOpen ?? open;

  if (!visible) return null;

  return (
    <ModalPortal onEscape={() => onClose?.()}>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Dialog'}
          tabIndex={-1}
          className={`m-auto w-full ${size} flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-blue-200/70 bg-white shadow-2xl outline-none dark:border-blue-900 dark:bg-[#061B3D]`}
        >
          {(title || showCloseButton) && (
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-blue-900/70">
              {title ? <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2> : <span />}
              {showCloseButton && (
                <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#168BFF] dark:hover:bg-white/10 dark:hover:text-white">
                  <X size={18} />
                </button>
              )}
            </header>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
          {footer && <footer className="border-t border-slate-200 px-5 py-4 dark:border-blue-900/70">{footer}</footer>}
        </section>
      </div>
    </ModalPortal>
  );
};

export default Modal;
