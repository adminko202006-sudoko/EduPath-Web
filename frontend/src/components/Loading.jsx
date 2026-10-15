import { LoaderCircle } from 'lucide-react';

const Loading = ({ label = 'Loading...', fullScreen = false, className = '' }) => (
  <div
    role="status"
    aria-live="polite"
    className={`${fullScreen ? 'min-h-[60vh]' : 'min-h-24'} flex items-center justify-center px-4 py-8 ${className}`.trim()}
  >
    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
      <LoaderCircle className="h-5 w-5 animate-spin text-[#168BFF]" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="sr-only">{label}</span>
  </div>
);

export default Loading;
