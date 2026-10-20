import { useEffect, useId, useSyncExternalStore } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { errorDialogs } from '../../services/errorDialogs';
import ModalPortal from './ModalPortal';

export default function ErrorDialogHost() {
  const errors = useSyncExternalStore(errorDialogs.subscribe, errorDialogs.getSnapshot);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const invalidFields = new Set();
    let scheduled = false;
    let active = true;
    const handleInvalid = event => {
      event.preventDefault();
      const field = event.target;
      const label = field.labels?.[0]?.textContent?.trim().replace(/\s+/g, ' ') || field.getAttribute('aria-label') || field.name || 'Field';
      invalidFields.add(`${label}: ${field.validationMessage}`);
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        if (active) errorDialogs.show([...invalidFields].join('\n'));
        invalidFields.clear();
        scheduled = false;
      });
    };
    document.addEventListener('invalid', handleInvalid, true);
    return () => { active = false; document.removeEventListener('invalid', handleInvalid, true); };
  }, []);
  const error = errors[0];
  if (!error) return null;
  const dismiss = () => errorDialogs.dismiss(error.id);

  return (
    <ModalPortal onEscape={dismiss} priority={100}>
      <div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} className="ep-card w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300"><AlertTriangle size={23} aria-hidden="true" /></span>
            <h2 id={titleId} className="flex-1 text-lg font-bold text-[#123B5D] dark:text-white">Unable to complete your request</h2>
            <button type="button" aria-label="Close error message" onClick={dismiss} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><X size={20} /></button>
          </div>
          <div id={descriptionId} className="max-h-[60dvh] overflow-y-auto overscroll-contain break-words whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
            {error.content || error.message}
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" onClick={dismiss} className="rounded-xl bg-[#123B5D] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0F3553] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4B400]">OK</button>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
