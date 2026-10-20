import { useContext, useEffect, useId } from 'react';
import { errorDialogs } from '../../services/errorDialogs';
import { RouteActivityContext } from '../../context/routeActivityContext';

// The original message and retry controls are rendered by the shared host.
export default function ErrorMessage({ message, children }) {
  const id = useId();
  const isActive = useContext(RouteActivityContext);
  useEffect(() => {
    if (isActive) errorDialogs.publish(id, message, children);
    else errorDialogs.remove(id);
  }, [id, message, children, isActive]);
  useEffect(() => () => errorDialogs.remove(id), [id]);

  if (!message) return null;
  return (
    <button type="button" onClick={() => errorDialogs.reopen(id)} className="my-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 underline decoration-red-300 underline-offset-4 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30">
      View error details
    </button>
  );
}
