/* =========================================================
   IMPERATIVE CONFIRM (window.confirm replacement)

   Lives in its own module so `Shared.jsx` only exports components and React
   Fast Refresh keeps working (`react-refresh/only-export-components`).
   ========================================================= */

const showConfirmDialog = ({
  title = 'Are you sure?',
  message = '',
} = {}) =>
  window.confirm(
    [title, message].filter(Boolean).join('\n\n')
  );

export { showConfirmDialog };
export default showConfirmDialog;
