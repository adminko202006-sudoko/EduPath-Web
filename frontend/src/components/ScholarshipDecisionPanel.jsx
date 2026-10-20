import ErrorMessage from './ui/ErrorMessage';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { needsEntranceExamReview } from '../utils/entranceExamReview';
import { ConfirmDialogHost } from './ui/ConfirmDialog';
import { useConfirmDialog } from './ui/useConfirmDialog';

export default function ScholarshipDecisionPanel({ application, onUpdated }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [choice, setChoice] = useState('');
  const [remarks, setRemarks] = useState('');
  const [revision, setRevision] = useState(0);
  const { confirm, dialog } = useConfirmDialog();
  useEffect(() => {
    const abort = new AbortController();
    api.get(`/admin/scholarship-applications/${application.id}/history`, { signal: abort.signal })
      .then(response => setHistory(response.data.data))
      .catch(failure => { if (!abort.signal.aborted) setError(failure.response?.data?.message || 'Unable to load decision history. Close and reopen this application to retry.'); });
    return () => abort.abort();
  }, [application.id, revision]);
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const accepted = await confirm({ title: 'Record final scholarship decision?', message: `Record this application as ${choice.replaceAll('_', ' ')}? Examination completion alone does not grant an award.`, confirmLabel: 'Record decision', destructive: false });
      if (!accepted) return;
      const response = await api.put(`/admin/scholarship-applications/${application.id}/award`, { award_status: choice, remarks, expected_revision: application.award_revision ?? 0 });
      onUpdated(response.data.data); setChoice(''); setRemarks(''); setRevision(value => value + 1);
    } catch (failure) { setError(failure.response?.data?.message || 'The award decision was not saved. Please refresh and retry.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-800 dark:bg-teal-950/30">
    <h3 className="font-bold text-[#123B5D] dark:text-teal-200">Separate scholarship award decision</h3>
    <p className="text-sm">Application approval permits eligibility/examination under the existing scholarship rules. It does not mean a scholarship was awarded. Current award: <strong>{(application.award_status || 'undecided').replaceAll('_', ' ')}</strong>.</p>
    {application.award_remarks && <p className="text-sm">Award remarks: {application.award_remarks}</p>}
    <Link className="inline-block text-sm font-semibold text-teal-800 underline dark:text-teal-200" to={needsEntranceExamReview(application.scholarship) ? '/admin/exams' : '/admin/online-exams'}>{needsEntranceExamReview(application.scholarship) ? 'Review face-to-face entrance examination results' : 'Review online examination results'}</Link>
    {error && <ErrorMessage message={error}><p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p></ErrorMessage>}
    {application.status === 'approved' ? <form onSubmit={save} className="grid gap-3">
      <label className="grid gap-1 text-sm">Final award decision<select required disabled={busy} value={choice} onChange={event => setChoice(event.target.value)} className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900"><option value="">Select a decision</option><option value="awarded">Awarded</option><option value="not_awarded">Not awarded</option></select></label>
      <label className="grid gap-1 text-sm">Decision reason / official reference<textarea required maxLength={2000} disabled={busy} value={remarks} onChange={event => setRemarks(event.target.value)} className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900" /></label>
      <button type="submit" disabled={busy} className="rounded-xl bg-[#123B5D] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Recording…' : 'Record final award decision'}</button>
    </form> : <p className="text-sm">Complete the application review before recording a final award decision.</p>}
    <details><summary className="cursor-pointer text-sm font-semibold">Decision history ({history.length})</summary><ol className="mt-3 space-y-3 text-sm">{history.map(item => <li key={item.id}><strong>{item.actor?.name || (item.actor_id === null ? 'System maintenance' : 'Unavailable account')}</strong> · {item.action.replaceAll('_', ' ')} · {item.old_status || '—'} → {item.new_status}<p>{item.remarks}</p><time className="text-xs">{new Date(item.created_at).toLocaleString()}</time></li>)}</ol></details>
    <ConfirmDialogHost dialog={dialog} />
  </section>;
}
