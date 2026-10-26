import ErrorMessage from '../../components/ui/ErrorMessage';
import { useEffect, useRef, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import api from '../../services/api';
import ModalPortal from '../../components/ui/ModalPortal';

const applicantName = (person) => [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' ') || person.user?.name || 'Applicant';

export default function ExamAssignmentDialog({ exam, onClose, onAssigned }) {
  const [filters, setFilters] = useState({ search: '', program: '', page: 1 });
  const [result, setResult] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [programError, setProgramError] = useState('');
  const [retry, setRetry] = useState(0);
  const [programRetry, setProgramRetry] = useState(0);
  const busy = useRef(false);
  const close = () => { if (!busy.current) onClose(); };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const response = await api.get(`/admin/exams/${exam.id}/candidates`, {
          signal: controller.signal,
          params: { search: filters.search || undefined, program_id: filters.program || undefined, page: filters.page },
        });
        if (!Array.isArray(response.data?.data)) throw new Error('Invalid candidate response');
        if (!controller.signal.aborted) setResult(response.data);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Unable to load applicants. Please try again.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [exam.id, filters, retry]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setProgramError('');
      try {
        const response = await api.get('/admin/programs', { signal: controller.signal });
        if (!Array.isArray(response.data?.data)) throw new Error('Invalid programs response');
        if (!controller.signal.aborted) setPrograms(response.data.data);
      } catch (failure) {
        if (!controller.signal.aborted) setProgramError(failure.response?.data?.message || 'Program filters could not be loaded.');
      }
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [programRetry]);

  const toggle = (id) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else if (next.size < 100) next.add(id);
    return next;
  });
  const submit = async (event) => {
    event.preventDefault();
    if (busy.current || !selected.size) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const response = await api.post(`/admin/exams/${exam.id}/assignments`, { applicant_ids: [...selected] });
      if (!response.data?.success || !response.data?.data?.id) throw new Error('Invalid assignment response');
      onAssigned(response.data.data, response.data.message);
      onClose();
    } catch (failure) {
      setError(Object.values(failure.response?.data?.errors || {}).flat()[0] || failure.response?.data?.message || 'Unable to assign applicants. Check the list before retrying.');
    } finally { busy.current = false; setSaving(false); }
  };

  return <ModalPortal onEscape={close}>
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="exam-assignment-title" aria-busy={saving} className="ep-card animate-scale-in flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-700"><div className="min-w-0"><h2 id="exam-assignment-title" className="text-xl font-bold text-[#123B5D] dark:text-sky-200">Assign Applicants</h2><p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-300">{exam.title}</p></div><button type="button" aria-label="Close applicant assignment" onClick={close} disabled={saving} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"><X size={20} /></button></header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Choose up to 100 applicants per save. Applicants already assigned to any entrance exam on this exam date are excluded, even if the session time is different. Program filters use their recorded admission applications; this does not require approved admission.</p>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Search applicants<div className="relative mt-1"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input type="search" value={filters.search} maxLength={150} disabled={saving} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder="Name or email" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 font-normal outline-none focus:ring-2 focus:ring-[#F4B400] dark:border-slate-600 dark:bg-slate-900" /></div></label><label className="text-sm font-semibold">Program<select value={filters.program} disabled={saving || Boolean(programError)} onChange={(event) => setFilters((current) => ({ ...current, program: event.target.value, page: 1 }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-normal outline-none focus:ring-2 focus:ring-[#F4B400] dark:border-slate-600 dark:bg-slate-900"><option value="">All programs</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label></div>
          {programError && <ErrorMessage message={programError}><p role="alert" className="text-sm text-amber-800 dark:text-amber-200">{programError} <button type="button" onClick={() => setProgramRetry((n) => n + 1)} disabled={saving} className="underline">Retry program filters</button></p></ErrorMessage>}
          {error && <ErrorMessage message={error}><p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error} <button type="button" onClick={() => { setSelected(new Set()); setRetry((n) => n + 1); }} disabled={saving} className="ml-2 underline">Retry loading applicants</button></p></ErrorMessage>}
          <p className="text-sm text-slate-600 dark:text-slate-300">Only applicants with all active required admission documents verified are available for assignment.</p>
          <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-300">{loading ? 'Loading applicants...' : `${result?.total ?? 0} applicants available`}</p>
          <fieldset disabled={saving || loading} className="space-y-2" aria-label="Applicant selection">
            {result?.data.map((person) => <label key={person.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><input type="checkbox" checked={selected.has(person.id)} disabled={!selected.has(person.id) && selected.size >= 100} onChange={() => toggle(person.id)} className="mt-1 h-4 w-4 accent-[#123B5D]" /><span className="min-w-0"><span className="block break-words text-sm font-bold">{applicantName(person)}</span><span className="block break-words text-xs text-slate-500 dark:text-slate-300">{person.user?.email || 'No email recorded'}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{[...new Set((person.admission_applications || []).map((application) => application.academic_program?.name).filter(Boolean))].join(', ') || 'No admission program recorded'}</span></span></label>)}
          </fieldset>
          {!loading && !error && result?.data.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">No applicants available for this exam date match these filters.</p>}
          {result && <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><button type="button" disabled={saving || loading || filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><span>Page {result.current_page} of {result.last_page}</span><button type="button" disabled={saving || loading || !result.next_page_url} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div>}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-700"><div className="text-sm"><strong>{selected.size} selected</strong>{selected.size > 0 && <button type="button" onClick={() => setSelected(new Set())} disabled={saving} className="ml-3 text-slate-500 underline dark:text-slate-300">Clear selection</button>}</div><div className="flex gap-2"><button type="button" onClick={close} disabled={saving} className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Cancel</button><button type="submit" disabled={saving || !selected.size} className="inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2941] disabled:opacity-50"><UserPlus size={16} />{saving ? 'Assigning...' : 'Assign Selected'}</button></div></footer>
      </form>
    </div>
  </ModalPortal>;
}
