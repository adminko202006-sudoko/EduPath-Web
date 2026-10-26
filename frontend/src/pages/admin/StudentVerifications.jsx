import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import ModalPortal from '../../components/ui/ModalPortal';
import SchoolIdPreview from '../../components/SchoolIdPreview';
import { studentTypes } from '../../services/studentTypes';

const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-800';
const button = 'rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 dark:border-slate-600';
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || 'The request failed. Check your connection and retry.';

function Review({ record, programs, onClose, onSaved }) {
  const [status, setStatus] = useState(record.status === 'verified' ? 'rejected' : 'verified');
  const [program, setProgram] = useState(record.academic_program_id || '');
  const [lrn, setLrn] = useState(record.lrn);
  const [feedback, setFeedback] = useState(''), [checked, setChecked] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [history, setHistory] = useState(null), [historyError, setHistoryError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    api.get(`/admin/student-verifications/${record.id}/history`).then(({ data }) => { if (active) setHistory(data.data); })
      .catch(() => { if (active) setHistoryError('Review history could not be loaded. Close and reopen to retry.'); });
    return () => { active = false; };
  }, [record.id]);
  const submit = async (event) => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await api.put(`/admin/student-verifications/${record.id}`, { status, revision: record.revision, academic_program_id: program || null, feedback, lrn, identity_checked: checked }); onSaved(); }
    catch (failure) { setError(errorText(failure)); }
    finally { lock.current = false; setBusy(false); }
  };
  const applicant = record.applicant;
  const close = () => { if (!lock.current) onClose(); };
  return <ModalPortal onEscape={close}><div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-3 sm:p-6"><section role="dialog" aria-modal="true" aria-labelledby="identity-review-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-2xl bg-white text-slate-800 shadow-xl dark:bg-slate-900 dark:text-slate-100">
    <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700"><h2 id="identity-review-title" className="text-xl font-bold">Review school identity</h2><button type="button" disabled={busy} className={button} onClick={close}>Cancel</button></header>
    <div className="space-y-5 overflow-y-auto p-5"><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Student</dt><dd>{applicant.user.name}</dd></div><div><dt className="font-semibold">Date of birth</dt><dd>{String(applicant.birth_date || '').slice(0, 10) || 'Not provided'}</dd></div><div><dt className="font-semibold">Email</dt><dd className="break-all">{applicant.user.email} ({applicant.user.email_verified_at ? 'verified' : 'unverified'})</dd></div><div><dt className="font-semibold">Student type</dt><dd>{studentTypes[record.student_type]}</dd></div><div><dt className="font-semibold">LRN</dt><dd>{record.lrn}</dd></div><div><dt className="font-semibold">TMC student number</dt><dd>{record.tmc_student_number || 'Not applicable'}</dd></div><div><dt className="font-semibold">School</dt><dd>{record.previous_school}</dd></div><div><dt className="font-semibold">Current status</dt><dd>{record.status}</dd></div></dl>
      <SchoolIdPreview path={`/admin/student-verifications/${record.id}/file`} />
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">Compare the name, birth date, LRN and school ID with official school records. For old students, confirm their TMC number and existing program. Do not approve an image based on appearance alone.</p>
      {record.status !== 'rejected' && <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm font-semibold">LRN confirmed from official records<input required pattern="[0-9]{12}" maxLength={12} inputMode="numeric" className={field} value={lrn} onChange={(event) => setLrn(event.target.value)} /><span className="mt-1 block text-xs font-normal">Correct a mistyped LRN only after checking the official record. Explain any correction below; the previous value remains in the audit history.</span></label>
        <label className="block text-sm font-semibold">Decision<select className={field} value={status} onChange={(event) => setStatus(event.target.value)}>{record.status === 'pending' && <option value="verified">Verify school identity</option>}<option value="rejected">{record.status === 'verified' ? 'Revoke verification and request correction' : 'Request correction / reject'}</option></select></label>
        {record.student_type === 'old' && status === 'verified' && <label className="block text-sm font-semibold">Confirmed existing TMC program *<select required className={field} value={program} onChange={(event) => setProgram(event.target.value)}><option value="">Confirm from college records</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.name}{item.is_active === false ? ' (inactive)' : ''}</option>)}</select></label>}
        <label className="block text-sm font-semibold">Feedback {(status === 'rejected' || lrn !== record.lrn) && '*'}<textarea required={status === 'rejected' || lrn !== record.lrn} maxLength={2000} value={feedback} onChange={(event) => setFeedback(event.target.value)} className={field} rows={3} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" required checked={checked} onChange={(event) => setChecked(event.target.checked)} />I checked the identity against official records and am recording this decision.</label>
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}<button className={`${button} bg-[#123B5D] text-white`} disabled={busy}>{busy ? 'Saving...' : 'Confirm decision'}</button>
      </fieldset></form>}
      {record.status === 'rejected' && <p className="text-sm">Awaiting a corrected submission from the student. The existing identity remains reserved to this account.</p>}
      <details><summary className="cursor-pointer font-semibold">Review history</summary>{historyError && <p role="alert">{historyError}</p>}{history === null && !historyError && <p>Loading...</p>}<ol className="mt-3 space-y-3 text-sm">{history?.map((event) => <li key={event.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p>{event.action} — {new Date(event.created_at).toLocaleString()} — account {event.actor_id}</p>{event.snapshot.feedback && <p>{event.snapshot.feedback}</p>}</li>)}</ol></details>
    </div></section></div></ModalPortal>;
}

export default function StudentVerifications() {
  const [status, setStatus] = useState('pending'), [search, setSearch] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1);
  const [data, setData] = useState(null), [error, setError] = useState(''), [selected, setSelected] = useState(null), [programs, setPrograms] = useState([]), [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const version = ++generation.current; setLoading(true); setError('');
    try {
      const [rows, courses] = await Promise.all([api.get('/admin/student-verifications', { params: { status, search: query, page } }), api.get('/admin/programs')]);
      if (version !== generation.current) return;
      setData(rows.data); setPrograms(courses.data.data);
    } catch (failure) { if (version === generation.current) { setData(null); setError(errorText(failure)); } }
    finally { if (version === generation.current) setLoading(false); }
  }, [status, query, page]);
  useEffect(() => { const tracker = generation; const timer = setTimeout(load, 0); return () => { clearTimeout(timer); tracker.current++; }; }, [load]);
  return <div className="space-y-5"><header><h1 className="text-2xl font-bold text-[#123B5D] dark:text-white">Student Verification</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Review school IDs, verify student identity and confirm existing programs for old students. Email verification remains a separate requirement.</p></header>
    <form onSubmit={(event) => { event.preventDefault(); setQuery(search); setPage(1); }} className="ep-card flex flex-wrap items-end gap-3 rounded-2xl p-4"><label className="text-sm font-semibold">Status<select className={field} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="pending">Pending review</option><option value="verified">Verified</option><option value="rejected">Needs correction</option><option value="">All</option></select></label><label className="min-w-0 flex-1 text-sm font-semibold">Search<input className={field} maxLength={100} placeholder="Name, email, LRN or TMC number" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className={button}>Search</button><button type="button" className={button} onClick={load} disabled={loading}>Refresh</button></form>
    {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}{loading && <p role="status">Loading identities...</p>}
    {!loading && data && <div className="ep-card overflow-x-auto rounded-2xl"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 dark:border-slate-700">{['Student', 'Type', 'LRN', 'Email', 'Status', 'Action'].map((label) => <th key={label} className="p-4">{label}</th>)}</tr></thead><tbody>{data.data.map((record) => <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800"><td className="p-4">{record.applicant.user.name}</td><td className="p-4">{studentTypes[record.student_type]}</td><td className="p-4">{record.lrn}</td><td className="p-4">{record.applicant.user.email_verified_at ? 'Verified' : 'Unverified'}</td><td className="p-4 capitalize">{record.status}</td><td className="p-4"><button className={button} onClick={() => setSelected(record)}>Review</button></td></tr>)}</tbody></table>{!data.data.length && <p className="p-6 text-sm">No identities match this filter.</p>}<div className="flex items-center justify-between gap-3 p-4 text-sm"><button className={button} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {data.current_page} of {data.last_page}</span><button className={button} disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>Next</button></div></div>}
    {selected && <Review key={selected.id} record={selected} programs={programs} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); void load(); }} />}
  </div>;
}
