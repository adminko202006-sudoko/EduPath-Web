import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenCheck, ChevronDown, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { ConfirmationDialog } from '../../components/ui/ConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import OnlineExamReviewNotes from '../../components/OnlineExamReviewNotes';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Shared';

const blankQuestion = () => ({ question: '', source: '', options: ['', '', '', ''], correct: 0 });
const field = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800';
const button = 'rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800';
const primary = `${button} bg-[#123B5D] text-white hover:bg-[#0B2941] dark:bg-[#123B5D] dark:hover:bg-[#0B2941]`;
const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : '—';
const applicantName = (attempt) => [attempt.applicant?.first_name, attempt.applicant?.last_name].filter(Boolean).join(' ') || attempt.applicant?.user?.name || `Applicant ${attempt.applicant_id}`;
const errorMessage = (error, fallback) => Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || fallback;

function Pager({ page, last, total, busy, onChange }) {
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-4 text-sm dark:border-gray-700">
    <span>{total} records · Page {page} of {last}</span>
    <div className="flex gap-2"><button className={button} disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>Previous</button><button className={button} disabled={busy || page >= last} onClick={() => onChange(page + 1)}>Next</button></div>
  </nav>;
}

export default function OnlineExamManagement() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(60);
  const [timingDraft, setTimingDraft] = useState(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [bankStatus, setBankStatus] = useState('');
  const [bankPage, setBankPage] = useState(1);
  const [attempts, setAttempts] = useState([]);
  const [attemptLoading, setAttemptLoading] = useState(true);
  const [attemptError, setAttemptError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', release: '', page: 1 });
  const [searchDraft, setSearchDraft] = useState('');
  const [pagination, setPagination] = useState({ last: 1, total: 0 });
  const [editor, setEditor] = useState(null);
  const [details, setDetails] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [retakeReasons, setRetakeReasons] = useState({});
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const bankRequest = useRef(0);
  const attemptRequest = useRef(0);
  const invalidateBank = useCallback(() => { bankRequest.current++; }, []);
  const invalidateAttempts = useCallback(() => { attemptRequest.current++; }, []);

  const loadBank = useCallback(async (background = false) => {
    if (!token) return;
    const request = ++bankRequest.current;
    if (background !== true) setBankLoading(true);
    setBankError('');
    try {
      const response = await api.get('/admin/online-exams/questions');
      if (request !== bankRequest.current) return;
      const data = response.data?.data;
      if (!Array.isArray(data?.questions)) throw new Error('Invalid question response');
      setQuestions(data.questions); setActiveCount(Number(data.active_question_count));
      setSecondsPerQuestion(Number(data.seconds_per_question));
    } catch (error) {
      if (request === bankRequest.current) setBankError(errorMessage(error, 'Could not load the question bank. Please retry.'));
    } finally { if (request === bankRequest.current) setBankLoading(false); }
  }, [token]);

  const loadAttempts = useCallback(async (background = false) => {
    if (!token) return;
    const request = ++attemptRequest.current;
    if (background !== true) setAttemptLoading(true);
    setAttemptError('');
    try {
      const response = await api.get('/admin/online-exams/attempts', { params: { ...filters, group_by: 'applicant' } });
      if (request !== attemptRequest.current) return;
      const data = response.data?.data;
      if (!Array.isArray(data?.data)) throw new Error('Invalid attempt response');
      setAttempts(data.data); setPagination({ last: data.last_page, total: data.total });
    } catch (error) {
      if (request === attemptRequest.current) setAttemptError(errorMessage(error, 'Could not load examination attempts. Please retry.'));
    } finally { if (request === attemptRequest.current) setAttemptLoading(false); }
  }, [token, filters]);

  useEffect(() => {
    const timer = setTimeout(() => { loadBank(); }, 0);
    return () => { clearTimeout(timer); invalidateBank(); };
  }, [loadBank, invalidateBank]);
  useEffect(() => {
    const timer = setTimeout(() => { loadAttempts(); }, 0);
    return () => { clearTimeout(timer); invalidateAttempts(); };
  }, [loadAttempts, invalidateAttempts]);
  useAutoRefresh(() => { loadBank(true); loadAttempts(true); });

  const filteredQuestions = useMemo(() => questions.filter((q) =>
    (!bankStatus || String(Boolean(q.is_active)) === bankStatus) &&
    `${q.id} ${q.question} ${q.source || ''}`.toLowerCase().includes(bankSearch.toLowerCase())
  ), [questions, bankStatus, bankSearch]);
  const bankLast = Math.max(1, Math.ceil(filteredQuestions.length / 10));
  const visibleBankPage = Math.min(bankPage, bankLast);
  const visibleQuestions = filteredQuestions.slice((visibleBankPage - 1) * 10, visibleBankPage * 10);

  const mutate = async (operation, message, onSuccess) => {
    if (mutationLock.current) return;
    mutationLock.current = true; setBusy(true); setActionError(''); setNotice('');
    try {
      await operation();
      onSuccess?.(); setConfirmation(null); setNotice(message);
      await Promise.all([loadBank(true), loadAttempts(true)]);
    } catch (error) { setActionError(errorMessage(error, 'The operation failed. Please try again.')); }
    finally { mutationLock.current = false; setBusy(false); }
  };

  const timing = timingDraft ?? { minutes: Math.floor(secondsPerQuestion / 60), seconds: secondsPerQuestion % 60 };
  const totalSeconds = Number(timing.minutes) * 60 + Number(timing.seconds);
  const saveTiming = (event) => {
    event.preventDefault();
    if (!Number.isInteger(totalSeconds) || totalSeconds < 1 || totalSeconds > 3600) {
      setActionError('Time per question must be between 1 second and 60 minutes.');
      return;
    }
    mutate(() => api.put('/admin/online-exams/settings', { seconds_per_question: totalSeconds }),
      'Examination timing saved. New attempts will use this limit.', () => {
        setSecondsPerQuestion(totalSeconds);
        setTimingDraft(null);
      });
  };

  const saveQuestion = (event) => {
    event.preventDefault();
    const { id, question, source, options, correct } = editor;
    if (options.filter((_, index) => index === Number(correct)).length !== 1) {
      setActionError('Select exactly one correct answer.'); return;
    }
    const payload = { question: question.trim(), source: source.trim() || null, options: options.map((text, index) => ({ text: text.trim(), is_correct: index === Number(correct) })) };
    mutate(() => id ? api.put(`/admin/online-exams/questions/${id}`, payload) : api.post('/admin/online-exams/questions', payload), 'Question saved.', () => setEditor(null));
  };
  const editQuestion = (question) => {
    setActionError('');
    setEditor({ id: question.id, question: question.question, source: question.source || '', options: question.options.map((o) => o.text), correct: question.options.findIndex((o) => o.is_correct) });
  };
  const requestRetake = (attempt) => {
    const reason = (retakeReasons[attempt.applicant_id] || '').trim();
    if (reason.length < 5) { setActionError('Enter a retake reason of at least 5 characters.'); return; }
    setConfirmation({ title: 'Authorize this retake?', message: `Authorize one additional attempt for ${applicantName(attempt)}? Reason: ${reason}`, destructive: false,
      action: () => mutate(() => api.post('/admin/online-exams/retake-grants', { applicant_id: attempt.applicant_id, reason }), 'Retake authorization recorded.', () => setRetakeReasons((current) => ({ ...current, [attempt.applicant_id]: '' }))) });
  };

  return <div className="space-y-6 pb-8 page-transition">
    <section className="ep-page-banner rounded-2xl bg-[#123B5D] p-6 text-white sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><BookOpenCheck className="mb-3 text-[#F4B400]" size={30} /><h1 className="text-2xl font-bold">Online Scholarship Examination</h1><p className="mt-2 text-sm text-blue-100">Manage questions, review attempts, and release official results.</p></div>
        <button className={button} disabled={busy || bankLoading || attemptLoading} onClick={() => { loadBank(); loadAttempts(); }}><RefreshCw className="mr-2 inline" size={16} />Refresh</button>
      </div>
    </section>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p>}
    {actionError && !editor && <ErrorState message={actionError} />}
    <div className="grid gap-4 sm:grid-cols-3">{[['Active questions', bankError ? 'Unavailable' : bankLoading ? 'Loading…' : `${activeCount} / 100 required`], ['Timing', bankError ? 'Unavailable' : bankLoading ? 'Loading…' : `${secondsPerQuestion} seconds per question`], ['Passing score', '50 / 100']].map(([title, value]) => <div key={title} className="ep-card p-5"><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="mt-2 font-bold">{value}</p></div>)}</div>
    <section className="ep-card space-y-4 p-5">
      <div><h2 className="text-lg font-bold">Time per question</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set a limit from 1 second to 60 minutes. Changes apply to new attempts; attempts already started keep their original timing.</p></div>
      <form onSubmit={saveTiming}>
        <fieldset disabled={busy || bankLoading || !!bankError} className="flex flex-wrap items-end gap-4">
          <label className="w-32 text-sm font-semibold">Minutes<input required type="number" min="0" max="60" step="1" className={`${field} mt-2`} value={timing.minutes} onChange={(e) => setTimingDraft({ ...timing, minutes: e.target.value })} /></label>
          <label className="w-32 text-sm font-semibold">Seconds<input required type="number" min="0" max="59" step="1" className={`${field} mt-2`} value={timing.seconds} onChange={(e) => setTimingDraft({ ...timing, seconds: e.target.value })} /></label>
          <button className={primary} disabled={!timingDraft}>{busy ? 'Saving…' : 'Save timing'}</button>
          <button type="button" className={button} disabled={!timingDraft} onClick={() => setTimingDraft(null)}>Cancel</button>
        </fieldset>
      </form>
      <p className="text-sm text-gray-500 dark:text-gray-400">Total time for 100 questions: {Number.isInteger(totalSeconds) && totalSeconds > 0 && totalSeconds <= 3600 ? `${Math.floor(totalSeconds * 100 / 60)} minutes${totalSeconds * 100 % 60 ? ` ${totalSeconds * 100 % 60} seconds` : ''}` : 'Enter a valid time limit'}.</p>
    </section>
    {!bankLoading && !bankError && activeCount < 100 && <p className="rounded-xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">At least 100 active questions are required before an applicant can begin.</p>}

    <section className="ep-card overflow-hidden">
      <div className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Question bank</h2><p className="text-sm text-gray-500 dark:text-gray-400">Used questions are immutable. Deactivate and add a new question when revisions are needed.</p></div><button className={primary} disabled={busy} onClick={() => { setActionError(''); setEditor(blankQuestion()); }}><Plus size={16} className="mr-1 inline" />Add question</button></div>
        <div className="grid gap-3 sm:grid-cols-2"><input aria-label="Search question bank" className={field} placeholder="Search question, ID or source" value={bankSearch} onChange={(e) => { setBankSearch(e.target.value); setBankPage(1); }} /><select aria-label="Question status" className={field} value={bankStatus} onChange={(e) => { setBankStatus(e.target.value); setBankPage(1); }}><option value="">All questions</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
      </div>
      {bankLoading ? <LoadingState message="Loading question bank..." /> : bankError ? <div className="p-5"><ErrorState message={bankError} onRetry={loadBank} /></div> : !visibleQuestions.length ? <EmptyState title="No matching questions" description="Adjust the filters or add a question." /> : <div className="divide-y divide-gray-200 dark:divide-gray-700">{visibleQuestions.map((question) => {
        const used = Number(question.attempts_count) > 0;
        return <article key={question.id} className="space-y-3 p-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="min-w-0 break-words font-semibold">#{question.id} · {question.question}</h3><span className="text-sm text-gray-500 dark:text-gray-400">{question.is_active ? 'Active' : 'Inactive'}{used ? ' · Used / locked' : ''}</span></div><ol className="grid gap-2 text-sm sm:grid-cols-2">{question.options.map((option) => <li key={option.id} className={option.is_correct ? 'font-semibold text-teal-700 dark:text-teal-300' : ''}>{option.is_correct ? 'Correct: ' : ''}{option.text}</li>)}</ol><div className="flex flex-wrap gap-2"><button className={button} disabled={busy || used} onClick={() => editQuestion(question)}>Edit</button><button className={button} disabled={busy} onClick={() => mutate(() => api.put(`/admin/online-exams/questions/${question.id}`, { is_active: !question.is_active }), 'Question status updated.')}>{question.is_active ? 'Deactivate' : 'Activate'}</button><button className={`${button} text-red-700 dark:text-red-300`} disabled={busy || used} onClick={() => { setActionError(''); setConfirmation({ title: 'Delete this question?', message: 'This permanently deletes an unused question and its options. Used questions must be retained.', destructive: true, action: () => mutate(() => api.delete(`/admin/online-exams/questions/${question.id}`), 'Question deleted.') }); }}>Delete</button></div></article>;
      })}</div>}
      {!bankError && <Pager page={visibleBankPage} last={bankLast} total={filteredQuestions.length} busy={busy || bankLoading} onChange={setBankPage} />}
    </section>

    <section className="ep-card overflow-hidden">
      <div className="space-y-4 p-5"><h2 className="text-lg font-bold">Examination attempts</h2><p className="text-sm text-gray-500 dark:text-gray-400">Expand an applicant to view their matching attempts. Scores below are restricted to administrators. Applicants see results only after official release.</p>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); setFilters((current) => ({ ...current, search: searchDraft.trim(), page: 1 })); }}><input aria-label="Search attempts" className={field} maxLength={255} placeholder="Applicant name, email or attempt ID" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} /><button className={button}>Search</button></form>
        <div className="grid gap-3 sm:grid-cols-2"><select aria-label="Attempt status" className={field} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}><option value="">All statuses</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="expired">Expired</option></select><select aria-label="Result release status" className={field} value={filters.release} onChange={(e) => setFilters({ ...filters, release: e.target.value, page: 1 })}><option value="">All release states</option><option value="released">Released</option><option value="unreleased">Unreleased</option></select></div>
      </div>
      {attemptLoading ? <LoadingState message="Loading attempts..." /> : attemptError ? <div className="p-5"><ErrorState message={attemptError} onRetry={loadAttempts} /></div> : !attempts.length ? <EmptyState title="No matching attempts" description="Try another search or status filter." /> : <div className="space-y-3 px-5 pb-5">{attempts.map((group) => <details key={group.applicant_id} className="group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-gray-50 p-4 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0"><p className="font-semibold">{applicantName(group)}</p><p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">{group.applicant?.user?.email}</p><p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{group.attempts.length} matching {group.attempts.length === 1 ? 'attempt' : 'attempts'} / {group.attempts.filter((attempt) => attempt.results_released_at).length} released</p></div>
          <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#123B5D] dark:text-blue-200">View attempts<ChevronDown size={18} className="transition-transform group-open:rotate-180" /></span>
        </summary>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 dark:bg-gray-800"><tr>{['Attempt', 'Status', 'Score', 'Started / completed', 'Actions'].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{group.attempts.map((attempt) => <tr key={attempt.id}><td className="p-4"><p className="font-semibold">Attempt #{attempt.id}</p><p className="text-xs text-gray-500">{attempt.question_count} questions</p></td><td className="p-4"><p className="capitalize">{attempt.status.replaceAll('_', ' ')}</p><p className="mt-1 text-xs">{attempt.results_released_at ? 'Officially released' : 'Unreleased'}</p></td><td className="p-4">{attempt.score == null ? 'Not scored' : `${Number(attempt.score).toFixed(2)} / 100`}<p className="text-xs">{attempt.passed == null ? '' : attempt.passed ? 'Passed' : 'Did not pass'}</p></td><td className="p-4"><p>{formatDate(attempt.started_at)}</p><p className="mt-1 text-xs">{formatDate(attempt.completed_at)}</p></td><td className="space-y-2 p-4"><div className="flex flex-wrap gap-2"><button className={button} onClick={() => setDetails(attempt)}>Details</button><button className={primary} disabled={busy || !['completed', 'expired'].includes(attempt.status) || !!attempt.results_released_at} onClick={() => { setActionError(''); setConfirmation({ title: 'Release this official result?', message: `Make attempt #${attempt.id} available to ${applicantName(attempt)} and notify them? This does not award a scholarship.`, destructive: false, action: () => mutate(() => api.post(`/admin/online-exams/attempts/${attempt.id}/release`), 'Official result released.') }); }}>Release</button><button className={button} disabled={busy || !['completed', 'expired'].includes(attempt.status)} onClick={() => { setActionError(''); requestRetake(attempt); }}>Grant retake</button></div><input aria-label={`Retake reason for ${applicantName(attempt)}`} maxLength={1000} className={field} placeholder="Retake reason (5+ characters)" value={retakeReasons[attempt.applicant_id] || ''} onChange={(e) => setRetakeReasons({ ...retakeReasons, [attempt.applicant_id]: e.target.value })} /></td></tr>)}</tbody></table></div>
      </details>)}</div>}
      {!attemptError && <Pager page={filters.page} last={pagination.last} total={pagination.total} busy={busy || attemptLoading} onChange={(page) => setFilters({ ...filters, page })} />}
    </section>

    {editor && <ModalPortal onEscape={() => !mutationLock.current && setEditor(null)}><div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="question-editor-title" aria-busy={busy} className="ep-card max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto p-6"><h2 id="question-editor-title" className="text-xl font-bold">{editor.id ? 'Edit question' : 'Add question'}</h2>{actionError && <div className="mt-4"><ErrorState message={actionError} /></div>}<form onSubmit={saveQuestion} className="mt-5 space-y-4"><fieldset disabled={busy} className="space-y-4"><label className="block text-sm font-semibold">Question<textarea required minLength={5} rows={3} className={`${field} mt-2`} value={editor.question} onChange={(e) => setEditor({ ...editor, question: e.target.value })} /></label><label className="block text-sm font-semibold">Source / reference<input className={`${field} mt-2`} maxLength={255} value={editor.source} onChange={(e) => setEditor({ ...editor, source: e.target.value })} /></label><p className="text-sm">Choose exactly one correct answer.</p>{editor.options.map((text, index) => <div key={index} className="flex items-center gap-3"><input type="radio" name="correct-answer" aria-label={`Option ${index + 1} is correct`} required checked={editor.correct === index} onChange={() => setEditor({ ...editor, correct: index })} /><input aria-label={`Option ${index + 1} text`} required maxLength={500} className={field} value={text} onChange={(e) => setEditor({ ...editor, options: editor.options.map((option, i) => i === index ? e.target.value : option) })} /></div>)}<div className="flex flex-wrap justify-end gap-3"><button type="button" className={button} onClick={() => setEditor(null)}>Cancel</button><button className={primary}>{busy ? 'Saving...' : 'Save question'}</button></div></fieldset></form></section></div></ModalPortal>}
    {details && <ModalPortal onEscape={() => setDetails(null)}><div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="attempt-detail-title" className="ep-card max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto p-6"><h2 id="attempt-detail-title" className="text-xl font-bold">Attempt #{details.id} · {applicantName(details)}</h2><p>Status: {details.status.replaceAll('_', ' ')} · Score: {details.score ?? 'Not scored'}</p><dl className="grid gap-3 text-sm sm:grid-cols-2">{[['Started', details.started_at], ['Deadline', details.expires_at], ['Completed', details.completed_at], ['Official release', details.results_released_at]].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd>{formatDate(value)}</dd></div>)}</dl><p className="text-sm">Released by user: {details.results_released_by ?? '—'}</p><p className="whitespace-pre-wrap text-sm">{details.remarks || 'No remarks recorded.'}</p><OnlineExamReviewNotes reviews={details.reviews} /><h3 className="font-semibold">Persisted question order ({details.assigned_questions?.length || 0})</h3><ol className="list-inside list-decimal space-y-2 text-sm">{details.assigned_questions?.map((question) => <li key={question.id}>{question.question}</li>)}</ol><button className={button} onClick={() => setDetails(null)}>Close</button></section></div></ModalPortal>}
    <ConfirmationDialog open={!!confirmation} title={confirmation?.title} message={confirmation?.message} destructive={confirmation?.destructive} busy={busy} onCancel={() => { if (!mutationLock.current) setConfirmation(null); }} onConfirm={() => confirmation?.action()} />
  </div>;
}
