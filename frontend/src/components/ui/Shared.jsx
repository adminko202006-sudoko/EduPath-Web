import {
  FileText,
  Award,
  CalendarDays,
  Megaphone,
  AlertTriangle,
  Inbox,
  Users,
} from 'lucide-react';

import { Check, Search, X } from 'lucide-react';

import { ConfirmationDialog } from './ConfirmDialog';
import ErrorMessage from './ErrorMessage';

/* =========================================================
   SHARED STATUS BADGE
   ========================================================= */

const STATUS_CONFIG = {
  // Normalized keys are matched case-insensitively.
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: FileText },
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300', icon: FileText },
  under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: AlertTriangle },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: AlertTriangle },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Check },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300', icon: X },
  withdrawn: { label: 'Withdrawn', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', icon: X },
  archive: { label: 'Archived', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: X },
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Check },
  unverified: { label: 'Unverified', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: AlertTriangle },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Check },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: X },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Megaphone },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300', icon: CalendarDays },
  completed: { label: 'Completed', className: 'bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300', icon: CalendarDays },
  enrolled: { label: 'Enrolled', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Check },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: X },
};

const normalize = (value) =>
  String(value ?? '').trim().toLowerCase();

const StatusBadge = ({ status, label, className = '' }) => {
  const key = normalize(status);

  const config =
    STATUS_CONFIG[key] || {
      label: label || status || 'Unknown',
      className:
        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      icon: Inbox,
    };

  const Icon = config.icon;

  const text =
    label || config.label || status;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        text-xs
        font-semibold
        whitespace-nowrap
        ${config.className}
        ${className}
      `}
    >
      <Icon
        size={12.5}
        strokeWidth={2.4}
      />

      {text}
    </span>
  );
};

import { RefreshCw } from 'lucide-react';

/* =========================================================
   EMPTY STATE
   ========================================================= */

const ICONS = {
  users: Users,
  file: FileText,
  award: Award,
  calendar: CalendarDays,
  megaphone: Megaphone,
  inbox: Inbox,
};

const EmptyState = ({
  icon = 'inbox',
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  onAction,
}) => {
  const Icon =
    typeof icon === 'string' ? ICONS[icon] || Inbox : icon;

  return (
    <div className="ep-card p-10 sm:p-12 text-center animate-fade-up">
      <div className="animate-float mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300">
        <Icon size={30} strokeWidth={2} />
      </div>

      <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`
            mt-6 inline-flex items-center justify-center gap-2
            rounded-xl bg-[#123B5D] px-5 py-3
            font-semibold text-white shadow-md
            transition-colors duration-200
             hover:bg-[#0F3553]
          `}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/* =========================================================
   LOADING STATE
   ========================================================= */

const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
    <RefreshCw className="h-5 w-5 animate-spin text-[#123B5D] dark:text-sky-300" />

    <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
      {message}
    </span>
  </div>
);

/* =========================================================
   ERROR STATE
   ========================================================= */

const ErrorState = ({
  message = 'Something went wrong.',
  onRetry,
}) => (
  <ErrorMessage message={message}>
  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50">
      <AlertTriangle className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="font-semibold">Something went wrong</p>

      <p className="mt-1 text-sm leading-5">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`
            mt-3 inline-flex items-center gap-2
            rounded-lg px-3 py-1.5
            text-xs font-bold
            bg-red-100 dark:bg-red-950/50
            transition hover:bg-red-200 dark:hover:bg-red-900/60
          `}
        >
          <RefreshCw size={13} />

          Try Again
        </button>
      )}
    </div>
  </div>
  </ErrorMessage>
);

/* =========================================================
   CONFIRM DIALOG
   Replaced by ConfirmDialog.jsx and ConfirmDialogHost.jsx.
   Keeping this export for backward compatibility.
   ========================================================= */

const ConfirmDialog = ({ destructive = false, ...props }) => (
  <ConfirmationDialog destructive={destructive} {...props} />
);

/* =========================================================
   SEARCH FILTER BAR
   ========================================================= */

const SearchFilterBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  children,
}) => (
  <div className="
    flex flex-col gap-3
    sm:flex-row sm:items-center sm:justify-between
  ">
    <div className="relative w-full max-w-sm">
      <Search
        size={17}
        className={`
          pointer-events-none absolute left-3.5 top-1/2
          -translate-y-1/2 text-gray-400
        `}
      />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`
          w-full rounded-xl border border-gray-200 bg-gray-50
          py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition
          placeholder:text-gray-400
          focus:border-[#123B5D] focus:bg-white focus:ring-2 focus:ring-[#123B5D]/20
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200
          dark:focus:bg-gray-800 dark:placeholder:text-gray-500
        `}
      />
    </div>

    {children && (
      <div className="flex flex-wrap items-center gap-2">
        {children}
      </div>
    )}
  </div>
);

/* =========================================================
   EXPORTS

   `showConfirmDialog` moved to ./showConfirmDialog so this file only exports
   components and React Fast Refresh keeps working.
   ========================================================= */

export {
  StatusBadge,
  EmptyState,
  LoadingState,
  ErrorState,
  ConfirmDialog,
  SearchFilterBar,
};
