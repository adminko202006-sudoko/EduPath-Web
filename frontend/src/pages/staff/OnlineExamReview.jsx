import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useAuth } from '../../context/useAuth';
import ModalPortal from '../../components/ui/ModalPortal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Shared';

const field = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-800';
const button = 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600';
const message = (error) => Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || 'Unable to complete this request. Please retry.';
const date = (value) => value ? new Date(value).toLocaleString() : '—';

export default function OnlineExamReview() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ data: [], last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const requestId = useRef(0);
  const lock = useRef(false);
  const invalidateRequests = useCallback(() => { requestId.current++; }, []);

  const load = useCallback(async (background = false) => {
    const id = ++requestId.current;
    if (!background) setLoading(true);
    setError('');
    try {
      const response = await api.get('/staff/online-exams/attempts', { params: filters });
      if (id === requestId.current) setData(response.data.data);
    } catch (err) {
      if (id === requestId.current) {
        setError(message(err));
        if ([401, 403].includes(err.response?.status)) { setData({ data: [], last_page: 1, total: 0 }); setEditor(null); }
      }
    } finally { if (id === requestId.current) setLoading(false); }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => { clearTimeout(timer); invalidateRequests(); };
  }, [load, invalidateRequests]);
  useAutoRefresh(() => load(true));

  const open = (attempt) => {
    const existing = attempt.reviews.find((review) => review.reviewed_by === user.id);
    setSaveError('');
    setEditor({ attempt, recommendation: existing?.recommendation || 'ready_for_admin_review', remarks: existing?.remarks || '' });
  };
  const save = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setSaving(true); setSaveError(''); setNotice('');
    try {
      await api.put(`/staff/online-exams/attempts/${editor.attempt.id}/review`, {
        recommendation: editor.recommendation, remarks: editor.remarks.trim(),
      });
      setEditor(null); setNotice('Recommendation recorded for administrator review.');
      await load(true);
    } catch (err) { setSaveError(message(err)); }
    finally { lock.current = false; setSaving(false); }
  };

  return <div className="page-transition space-y-6 p-4 text-slate-900 dark:text-slate-100 sm:p-6">
    <header className="ep-card space-y-2 p-6"><h1 className="text-2xl font-bold text-[#123B5D] dark:text-sky-300">Online Examination Review</h1><p className="text-sm">Monitor applicants with an approved admission in your assigned programs. Recommendations go to the administrator; official result release and retake authorization remain separate.</p></header>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{notice}</p>}
    <section className="ep-card overflow-hidden">
      <form onSubmit={(e) => { e.preventDefault(); setFilters({ ...filters, search: search.trim(), page: 1 }); }} className="flex flex-wrap gap-3 p-4">
        <input aria-label="Search applicants" placeholder="Applicant name" maxLength={255} className={`${field} sm:flex-1`} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Attempt status" className={`${field} sm:w-auto`} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}><option value="">All statuses</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="expired">Expired</option></select>
        <button className={button}>Search</button>
      </form>
      {error ? <ErrorState message={error} onRetry={() => load()} /> : loading ? <LoadingState message="Loading examination attempts..." /> : !data.data.length ? <EmptyState title="No matching attempts" description="Only applicants in your assigned programs are shown." /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800"><tr>{['Applicant', 'Status / progress', 'Score', 'Review'].map((label) => <th key={label} className="p-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{data.data.map((attempt) => <tr key={attempt.id}>
        <td className="p-4"><p className="font-semibold">{attempt.applicant.first_name} {attempt.applicant.last_name}</p><p className="text-xs">Examination attempt · {date(attempt.started_at)}</p></td>
        <td className="p-4"><p>{attempt.status.replaceAll('_', ' ')}</p><p>{Math.min(attempt.current_question_index, attempt.question_count)} / {attempt.question_count}</p><p>{attempt.results_released_at ? 'Officially released' : 'Not released to applicant'}</p></td>
        <td className="p-4">{attempt.score == null ? 'Not scored' : `${attempt.score} / 100`}</td>
        <td className="space-y-3 p-4">{attempt.reviews.map((review) => <div key={review.id} className="max-w-md"><p className="font-semibold">{review.reviewer?.name || 'Former reviewer'} · {review.recommendation.replaceAll('_', ' ')}</p><p className="whitespace-pre-wrap break-words">{review.remarks}</p><p className="text-xs">{date(review.updated_at)}</p></div>)}<button className={button} disabled={!!attempt.results_released_at || !['completed', 'expired'].includes(attempt.status)} onClick={() => open(attempt)}>Record recommendation</button></td>
      </tr>)}</tbody></table></div>}
      <nav aria-label="Attempt pagination" className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><span>{data.total} attempts · Page {filters.page} of {data.last_page}</span><div className="flex gap-2"><button className={button} disabled={loading || filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button><button className={button} disabled={loading || filters.page >= data.last_page} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button></div></nav>
    </section>
    {editor && <ModalPortal onEscape={() => !lock.current && setEditor(null)}><div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="review-title" aria-busy={saving} className="ep-card max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto p-6"><h2 id="review-title" className="text-xl font-bold">Review examination attempt</h2><p className="mt-2 text-sm">This recommendation does not release results or award a scholarship.</p>{saveError && <div role="alert" className="mt-4"><ErrorState message={saveError} /></div>}<form className="mt-4" onSubmit={save}><fieldset disabled={saving} className="space-y-4"><label className="block text-sm font-semibold">Recommendation<select className={`${field} mt-2`} value={editor.recommendation} onChange={(e) => setEditor({ ...editor, recommendation: e.target.value })}><option value="ready_for_admin_review">Ready for administrator review</option><option value="needs_attention">Needs attention</option></select></label><label className="block text-sm font-semibold">Review notes<textarea required minLength={5} maxLength={2000} rows={4} className={`${field} mt-2`} value={editor.remarks} onChange={(e) => setEditor({ ...editor, remarks: e.target.value })} /></label><div className="flex justify-end gap-3"><button type="button" className={button} onClick={() => setEditor(null)}>Cancel</button><button className={`${button} bg-[#123B5D] text-white`}>{saving ? 'Saving...' : 'Save recommendation'}</button></div></fieldset></form></section></div></ModalPortal>}
  </div>;
}
