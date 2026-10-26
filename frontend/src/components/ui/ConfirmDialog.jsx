
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

import ModalPortal from './ModalPortal';

/* =========================================================
   DIALOG STATE
   ========================================================= */

/* =========================================================
   DIALOG HOST

   The `useConfirmDialog` hook lives in ./useConfirmDialog so this file only
   exports components and React Fast Refresh keeps working.
   ========================================================= */

const ConfirmationDialog = ({
    open = false,
    title = 'Are you sure?',
    message = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = true,
    busy = false,
    onCancel,
    onConfirm,
  }) => {

  const cancel = () => {
    if (!busy) onCancel?.();
  };

  const accept = () => {
    if (!busy) onConfirm?.();
  };

  if (!open) {
    return null;
  }

  return (
    <ModalPortal onEscape={cancel}>
      <div
        className="
          fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4
        "
        role="dialog"
        aria-modal="true"
        aria-busy={busy}
        aria-label={title}
        tabIndex={-1}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            cancel();
          }
        }}
      >
        <div className="ep-card animate-scale-in w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6">
        <div className="flex items-start gap-4">
          <div
            className={`
              flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
              ${destructive
                ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300'
                : 'bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300'}
            `}
          >
            <AlertTriangle size={20} strokeWidth={2.2} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>

            {message && (
              <p className="mt-2 break-words text-sm leading-6 text-gray-500 dark:text-gray-400">
                {message}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={cancel}
            className="
              shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100
              hover:text-gray-600
              dark:hover:bg-gray-800 dark:hover:text-gray-300
              disabled:opacity-50
            "
            aria-label="Close dialog"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 dark:border-gray-700 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="
              rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold
              text-gray-700 transition hover:bg-gray-50
              dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300
              dark:hover:bg-gray-700 disabled:opacity-50
            "
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={accept}
            disabled={busy}
            className={`
              inline-flex items-center justify-center gap-2
              rounded-xl px-5 py-2.5 font-semibold text-white shadow-md
              transition disabled:cursor-not-allowed disabled:opacity-60
              ${destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#123B5D] hover:bg-[#0F3553]'}
            `}
          >
            {busy && <RefreshCw size={15} className="animate-spin" />}

            {confirmLabel}
          </button>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
};

const ConfirmDialogHost = ({ dialog }) => (
  <ConfirmationDialog
    {...dialog?.state}
    onCancel={() => dialog?.settle?.(false)}
    onConfirm={() => dialog?.settle?.(true)}
  />
);

export { ConfirmationDialog, ConfirmDialogHost };
