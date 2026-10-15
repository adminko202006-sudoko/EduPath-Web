import { useEffect } from 'react';
import { X } from 'lucide-react';

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

  useEffect(() => {
    if (!visible) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
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
        className={`my-auto w-full ${size} overflow-hidden rounded-2xl border border-blue-200/70 bg-white shadow-2xl dark:border-blue-900 dark:bg-[#061B3D]`}
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
        <div className="p-5">{children}</div>
        {footer && <footer className="border-t border-slate-200 px-5 py-4 dark:border-blue-900/70">{footer}</footer>}
      </section>
    </div>
  );
};

export default Modal;
