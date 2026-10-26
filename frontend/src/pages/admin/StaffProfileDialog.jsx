import { useEffect, useState } from 'react';
import { UserRound, X } from 'lucide-react';
import api, { getServerBaseUrl } from '../../services/api';
import ModalPortal from '../../components/ui/ModalPortal';
import { ErrorState, LoadingState } from '../../components/ui/Shared';

const permissionLabels = {
  manage_admissions: 'Manage admissions',
  verify_documents: 'Verify documents',
  manage_exams: 'Manage scheduled entrance exams',
  review_online_exams: 'Review online exam attempts',
  manage_scholarships: 'Manage scholarships',
  manage_announcements: 'Manage announcements',
  send_notifications: 'Send notifications',
  view_reports: 'View reports',
};

const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleString() : 'Not provided';

export default function StaffProfileDialog({ staffId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedPhoto, setFailedPhoto] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/admin/staff/${staffId}`, { signal: controller.signal });
        const data = response.data?.data;
        if (!data?.id) throw new Error('Invalid staff profile response');
        if (!controller.signal.aborted) setProfile(data);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Unable to load this staff profile. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [staffId, retry]);

  const name = profile && ([profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || profile.user?.name);
  const details = profile ? [
    ['Account name', profile.user?.name],
    ['Email', profile.user?.email],
    ['Employee ID', profile.employee_id],
    ['Staff role', profile.staff_role],
    ['Position', profile.position],
    ['Department', profile.department],
    ['Status', profile.status],
    ['Account created', formatDate(profile.user?.created_at)],
    ['Profile updated', formatDate(profile.updated_at)],
  ] : [];

  return <ModalPortal onEscape={onClose}>
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="staff-profile-title" aria-busy={loading} className="ep-card animate-scale-in flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 id="staff-profile-title" className="text-lg font-bold text-[#123B5D] dark:text-sky-300">Staff Profile</h2>
          <button type="button" onClick={onClose} aria-label="Close staff profile" className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {loading ? <LoadingState message="Loading staff profile..." /> : error ? <ErrorState message={error} onRetry={() => setRetry((value) => value + 1)} /> : profile && <>
            <div className="flex items-center gap-4 rounded-2xl bg-[#123B5D] p-5 text-white">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F4B400]">{profile.user?.profile_photo && failedPhoto !== profile.user.profile_photo ? <img src={`${getServerBaseUrl()}/storage/${profile.user.profile_photo}`} alt={`${name || 'Staff'} profile`} onError={() => setFailedPhoto(profile.user.profile_photo)} className="h-full w-full rounded-xl object-cover" /> : <UserRound size={28} />}</div>
              <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-[#F4B400]">Trinidad Municipal College · Staff</p><h3 className="mt-1 break-words text-xl font-bold">{name || 'Staff member'}</h3><p className="mt-1 text-sm text-blue-100">{profile.staff_role || 'No staff role recorded'}</p></div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><dt className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-2 break-words text-sm font-semibold text-gray-900 dark:text-white">{value || 'Not provided'}</dd></div>)}</dl>
            <section><h3 className="font-bold text-[#123B5D] dark:text-sky-300">Programs served</h3><div className="mt-3 flex flex-wrap gap-2">{profile.academic_programs?.length ? profile.academic_programs.map((program) => <span key={program.id} className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">{program.name}{program.code ? ` (${program.code})` : ''}</span>) : <p className="text-sm text-gray-500 dark:text-gray-400">No programs assigned.</p>}</div></section>
            <section><h3 className="font-bold text-[#123B5D] dark:text-sky-300">Current permissions</h3><dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(permissionLabels).map(([key, label]) => <div key={key} className="flex justify-between gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700"><dt>{label}</dt><dd className={profile.permissions?.[key] ? 'font-semibold text-teal-700 dark:text-teal-300' : 'text-gray-500 dark:text-gray-400'}>{profile.permissions?.[key] ? 'Allowed' : 'Not granted'}</dd></div>)}</dl></section>
          </>}
        </div>
      </section>
    </div>
  </ModalPortal>;
}
