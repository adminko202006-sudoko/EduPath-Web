import { useEffect, useRef, useState } from 'react';

const initialDialogState = {
  open: false,
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: true,
  busy: false,
};

/* =========================================================
   CUSTOM HOOK
   ========================================================= */

const useConfirmDialog = () => {
  const [state, setState] = useState(initialDialogState);
  const resolveRef = useRef(null);

  useEffect(() => () => {
    // A caller must not remain suspended after its dialog is unmounted.
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const confirm = (options = {}) =>
    new Promise((resolve) => {
      // A rapid second request cancels the earlier confirmation rather than
      // orphaning its promise or allowing both operations to proceed.
      resolveRef.current?.(false);
      resolveRef.current = resolve;

      setState({
        open: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        destructive: options.destructive !== false,
        busy: false,
      });
    });

  const settle = (result) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;

    // Close the dialog, then deliver the result to the caller.
    setState(initialDialogState);

    resolve?.(result);
  };

  const dialog = {
    state,
    settle,
  };

  return { confirm, dialog };
};

export { useConfirmDialog };
export default useConfirmDialog;
