import { ChevronDown, UserRound } from 'lucide-react';

// Group by record identity, never by a display name shared by different people.
function groupApplications(applications) {
  const groups = new Map();
  applications.forEach((application) => {
    const applicant = application.applicant || application.admission_application?.applicant || application.student || {};
    const user = applicant.user || application.user || {};
    const applicantId = application.applicant_id ?? applicant.id;
    const userId = applicant.user_id ?? user.id;
    const key = applicantId != null ? `applicant:${applicantId}`
      : userId != null ? `user:${userId}` : `application:${application.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: [applicant.first_name, applicant.middle_name, applicant.last_name].filter(Boolean).join(' ')
          || user.name || applicant.name || application.applicant_name || 'Unknown Applicant',
        email: user.email || applicant.email || application.applicant_email || '',
        applications: [],
      });
    }
    groups.get(key).applications.push(application);
  });
  return [...groups.values()];
}

export default function ApplicantApplicationGroups({ applications, children }) {
  // Keep the page's existing loading and empty states when there are no rows.
  if (!applications.length) return children(applications);
  const groups = groupApplications(applications);

  return <div className="space-y-3 p-3 sm:p-4">
    <p className="px-1 text-sm text-slate-500 dark:text-slate-400">
      {groups.length} applicant{groups.length === 1 ? '' : 's'} · Expand a name to view matching applications.
    </p>
    {groups.map((group) => {
      const pending = group.applications.filter((application) => application.status === 'pending').length;
      return <details key={group.key} className="group/applicant overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#123B5D] dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-sky-500/10 dark:text-sky-300"><UserRound size={19} /></span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-semibold text-slate-900 dark:text-white">{group.name}</span>
            {group.email && <span className="mt-0.5 block break-all text-xs text-slate-500 dark:text-slate-400">{group.email}</span>}
            {pending > 0 && <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-300">{pending} pending</span>}
          </span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {group.applications.length}<span className="hidden sm:inline"> application{group.applications.length === 1 ? '' : 's'}</span>
          </span>
          <ChevronDown aria-hidden="true" size={18} className="shrink-0 text-slate-400 transition-transform group-open/applicant:rotate-180" />
        </summary>
        <div className="border-t border-slate-200 dark:border-slate-700">{children(group.applications)}</div>
      </details>;
    })}
  </div>;
}
