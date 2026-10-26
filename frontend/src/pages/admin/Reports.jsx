import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import './reports.css';
import { useAuth } from '../../context/useAuth';

const initial = { academic_program_id: '', admission_period_id: '', scholarship_id: '', status: '', from: '', to: '' };
const control = 'rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const readable = value => String(value ?? '—').replaceAll('_', ' ');

export default function Reports() {
  const { user } = useAuth();
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('reports');
  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ programs: [], periods: [], scholarships: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actor, setActor] = useState('');
  const [subject, setSubject] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [staff, setStaff] = useState([]);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setBusy(true); setError('');
    const endpoint = tab === 'reports' ? '/admin/reports' : tab === 'activity' ? '/admin/activity' : '/admin/notification-deliveries';
    const params = tab === 'reports' ? { ...filters, admission_page: page, scholarship_page: page } : tab === 'activity' ? { page, actor_id: actor, subject_type: subject } : { page, status: deliveryStatus };
    try {
      const response = await api.get(endpoint, { params });
      if (generation.current === request) setData(response.data.data);
    } catch (failure) {
      if (generation.current === request) { setData(null); setError(failure.response?.data?.message || 'Unable to load records. Please retry.'); }
    } finally { if (generation.current === request) setBusy(false); }
  }, [tab, filters, page, actor, subject, deliveryStatus]);
  useAutoRefresh(load);
  useEffect(() => {
    let active = true;
    const requests = generation;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; requests.current++; };
  }, [load]);
  useEffect(() => {
    const abort = new AbortController();
    Promise.all(['/admin/programs', '/admin/admission-periods', '/admin/scholarships', '/admin/staff'].map(url => api.get(url, { signal: abort.signal })))
      .then(responses => { const lists = responses.map(r => Array.isArray(r.data.data) ? r.data.data : r.data.data?.data || []); setOptions({ programs: lists[0], periods: lists[1], scholarships: lists[2] }); setStaff(lists[3]); })
      .catch(error => { if (!abort.signal.aborted) setError(error.response?.data?.message || 'Unable to load filter options. Refresh this page to retry.'); });
    return () => abort.abort();
  }, []);
  const download = async dataset => {
    if (actionBusy) return;
    setActionBusy(true); setError('');
    try {
      const response = await api.get('/admin/reports/export', { params: { ...filters, dataset }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a');
      link.href = url; link.download = `edupath-${dataset}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      let message = 'Export failed. Narrow the filters and retry.';
      if (failure.response?.data instanceof Blob) { try { message = JSON.parse(await failure.response.data.text()).message || message; } catch { /* Non-JSON server errors keep the visible fallback. */ } }
      setError(message);
    } finally { setActionBusy(false); }
  };
  const retry = async id => {
    if (actionBusy) return;
    setActionBusy(true); setError('');
    try { await api.post(`/admin/notification-deliveries/${id}/retry`, {}, { skipGlobalRefresh: true }); await load(); }
    catch (failure) { setError(failure.response?.data?.message || 'Unable to queue the retry.'); }
    finally { setActionBusy(false); }
  };
  const list = tab === 'reports' ? data?.admission_records : data;
  const lastPage = tab === 'reports' ? Math.max(data?.admission_records?.last_page || 1, data?.scholarship_records?.last_page || 1) : data?.last_page || 1;
  return <main className="ep-report-page space-y-5">
    <header className="ep-page-banner rounded-2xl p-6"><h1 className="text-2xl font-bold">Reports & Activity</h1><p className="mt-2 text-sm">Review admission progress, separate scholarship awards, recorded decisions, and push delivery.</p></header>
    <div className="ep-report-tools flex flex-wrap gap-2" role="group" aria-label="Report views">
      {['reports', 'activity', 'deliveries'].map(value => <button key={value} type="button" aria-pressed={tab === value} onClick={() => { setTab(value); setPage(1); setData(null); }} className={`${control} ${tab === value ? 'ring-2 ring-teal-600' : ''}`}>{readable(value)}</button>)}
      
    </div>
    {error && <ErrorMessage message={error}><p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p></ErrorMessage>}
    {tab === 'activity' && <div className="ep-card ep-report-tools flex flex-wrap gap-3 p-5"><label className="grid gap-1 text-sm">Recorded by<select className={control} value={actor} onChange={event => { setActor(event.target.value); setPage(1); }}><option value="">All accounts</option><option value={user.id}>{user.name} (Admin)</option>{staff.map(member => <option key={member.id} value={member.user?.id}>{member.user?.name || `${member.first_name || ''} ${member.last_name || ''}`}</option>)}</select></label><label className="grid gap-1 text-sm">Activity type<select value={subject} className={control} onChange={event => { setSubject(event.target.value); setPage(1); }}><option value="">All</option>{['admission','scholarship','document','staff','online_exam','scheduled_exam'].map(value => <option key={value} value={value}>{readable(value)}</option>)}</select></label></div>}
    {tab === 'deliveries' && <label className="ep-report-tools inline-grid gap-1 text-sm">Delivery status<select value={deliveryStatus} className={control} onChange={event => { setDeliveryStatus(event.target.value); setPage(1); }}><option value="">All</option>{['pending','sent','failed','skipped'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
    {tab === 'reports' && <form className="ep-card ep-report-tools grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3" onSubmit={event => { event.preventDefault(); setPage(1); setFilters({ ...draft }); }}>
      {[['academic_program_id', 'Program', options.programs], ['admission_period_id', 'Admission period', options.periods], ['scholarship_id', 'Scholarship', options.scholarships]].map(([key, title, rows]) => <label key={key} className="grid gap-1 text-sm">{title}<select value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} className={control}><option value="">All</option>{rows.map(row => <option key={row.id} value={row.id}>{row.name || row.title || row.academic_year || 'Admission period'}</option>)}</select></label>)}
      <label className="grid gap-1 text-sm">Application status<select value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value }))} className={control}><option value="">All</option>{['pending', 'under_review', 'approved', 'rejected', 'withdrawn'].map(value => <option key={value} value={value}>{value === 'approved' ? 'Approved (application review)' : readable(value)}</option>)}</select></label>
      {['from', 'to'].map(key => <label key={key} className="grid gap-1 text-sm">{key === 'from' ? 'Submitted from' : 'Submitted through'}<input type="date" value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} className={control} /></label>)}
      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3"><button className="rounded-xl bg-[#123B5D] px-5 py-3 text-white" disabled={busy}>Apply filters</button><button type="button" className={control} onClick={() => { setDraft(initial); setFilters(initial); setPage(1); }}>Clear</button>{['admissions', 'scholarships'].map(value => <button type="button" key={value} onClick={() => download(value)} disabled={actionBusy || busy} className={control}>Export {value} CSV</button>)}<button type="button" onClick={() => window.print()} disabled={busy || !data} className={control}>Print / Save PDF</button></div>
      <p className="text-xs text-slate-600 dark:text-slate-300 sm:col-span-2 lg:col-span-3">Scholarship program/period filters use the applicant’s associated admission records. Print includes the currently displayed pages. CSV includes all matching records, up to 10,000. Application approval never automatically records an award.</p>
    </form>}
    {busy && <p role="status" className="ep-card p-5">Loading records…</p>}
    {!busy && data && tab === 'reports' && <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Admission applications', data.admissions.total], ['Awaiting admission review', data.admissions.pending], ['Scholarship applications', data.scholarships.total], ['Recorded awards', data.scholarships.awarded], ['Pending document reviews', data.pending_documents], ['Average decision hours', data.average_decision_hours ?? 'No recorded decisions']].map(([label, value]) => <div key={label} className="ep-card p-5"><p className="text-sm text-slate-600 dark:text-slate-300">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</section>
      <Records title="Admission applications" rows={list?.data} /><Records title="Scholarship applications" rows={data.scholarship_records?.data} />
      <section className="ep-card p-5"><h2 className="font-bold">Missing or unverified required documents — first 50 applications</h2><p className="my-2 text-xs text-slate-600 dark:text-slate-300">Matches current required document names and program assignments. This is a review aid, not an additional admission restriction.</p>{data.missing_required_documents.length ? data.missing_required_documents.map(row => <p key={row.id} className="border-b border-slate-200 py-3 dark:border-slate-700">{row.applicant?.user?.name} · {row.academic_program?.name}</p>) : <p>No matching applications.</p>}</section>
      <section className="ep-card p-5"><h2 className="font-bold">Recorded actions per staff member / administrator</h2><p className="my-2 text-xs">Uses the selected date range. Historical actions before this feature are not inferred.</p>{data.workload.map(row => <p key={row.actor_id ?? 'unknown'} className="py-2">{row.actor?.name || 'Unavailable account'} · {row.actions} actions</p>)}</section>
    </>}
    {!busy && data && tab === 'activity' && <section className="ep-card divide-y divide-slate-200 p-5 dark:divide-slate-700">{data.data.length ? data.data.map(row => <article key={row.id} className="py-4"><p className="font-semibold">{row.actor?.name || 'Unavailable account'} · {readable(row.action)}</p><p className="text-sm">{row.subject_type}: {readable(row.old_status)} → {readable(row.new_status)}</p><p className="text-sm">{row.remarks}</p><time className="text-xs">{new Date(row.created_at).toLocaleString()}</time></article>) : <p>No recorded activity yet.</p>}</section>}
    {!busy && data && tab === 'deliveries' && <section className="ep-card divide-y divide-slate-200 p-5 dark:divide-slate-700"><p className="py-3 text-sm">Push delivery requires the scheduled dispatcher. Failed deliveries retry up to eight times; in-app notifications remain available.</p>{data.data.length ? data.data.map(row => <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">Notification · {row.status}</p><p className="text-sm">Attempts: {row.attempts} · {row.last_error}</p></div>{row.status === 'failed' && <button type="button" disabled={actionBusy} onClick={() => retry(row.id)} className={control}>Queue retry</button>}</article>) : <p>No push deliveries queued.</p>}</section>}
    {!busy && data && <nav aria-label="Report pagination" className="ep-report-tools flex items-center justify-between gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} className={control}>Previous</button><span>Page {page} of {lastPage}</span><button type="button" disabled={page >= lastPage} onClick={() => setPage(value => value + 1)} className={control}>Next</button></nav>}
  </main>;
}

function Records({ title, rows = [] }) {
  return <section className="ep-card overflow-hidden"><h2 className="p-5 font-bold">{title}</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['ID', 'Applicant', 'Program / scholarship', 'Review status', 'Award status'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{rows.length ? rows.map(row => <tr key={row.id}><td className="p-3">{row.id}</td><td className="p-3">{row.applicant?.user?.name}</td><td className="p-3">{row.academic_program?.name || row.scholarship?.name}</td><td className="p-3">{row.status === 'approved' && row.scholarship ? 'Approved for eligibility' : readable(row.status)}</td><td className="p-3">{readable(row.award_status)}</td></tr>) : <tr><td colSpan={5} className="p-5">No matching records.</td></tr>}</tbody></table></div></section>;
}
