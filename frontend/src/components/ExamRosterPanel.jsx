import ErrorMessage from './ui/ErrorMessage';
import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import api from '../services/api';

export default function ExamRosterPanel({ exam, assignmentId, onUpdated }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const admin = assignmentId === undefined;
  const endpoint = admin ? `/admin/exams/${exam.id}/roster` : `/applicant/exams/${assignmentId}/roster`;

  const download = async source => {
    if (busy) return;
    setBusy(source); setError('');
    try {
      const response = await api.get(endpoint, { params: { source }, responseType: 'blob', timeout: 60000 });
      if (!response.headers['content-type']?.includes('application/pdf')) throw new Error('The server did not return a PDF. Please retry.');
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url; link.download = `entrance-exam-${exam.id}-${source}-roster.pdf`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      let message = failure.response?.data?.message;
      if (failure.response?.data instanceof Blob) {
        try { message = JSON.parse(await failure.response.data.text()).message; } catch { /* Use the download failure message below. */ }
      }
      setError(message || 'Unable to download the roster PDF. Please retry.');
    } finally { setBusy(''); }
  };

  const upload = async event => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy('upload'); setError(''); setSuccess('');
    try {
      const payload = new FormData(); payload.append('roster_pdf', file);
      const response = await api.post(endpoint, payload);
      onUpdated?.(response.data.data);
      setFile(null); event.target.reset(); setSuccess('Roster PDF uploaded. Assigned applicants can download it here.');
    } catch (failure) {
      setError(Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || 'The roster PDF was not uploaded. Please retry.');
    } finally { setBusy(''); }
  };

  return <section className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100">
    <h3 className="font-bold text-[#123B5D] dark:text-blue-200">Examination roster PDFs</h3>
    <p className="text-sm text-slate-600 dark:text-slate-300">Check applicant names, date, time, and venue for this session. The generated roster uses the current assigned applicants.</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!!busy} onClick={() => download('generated')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#123B5D] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Download size={16} />{busy === 'generated' ? 'Generating...' : 'Download generated roster'}</button>
      {exam.has_roster_pdf && <button type="button" disabled={!!busy} onClick={() => download('uploaded')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600"><Download size={16} />{busy === 'uploaded' ? 'Downloading...' : 'Download uploaded roster'}</button>}
    </div>
    {admin && <form onSubmit={upload} className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
      <label className="grid gap-2 text-sm font-medium">Upload or replace prepared roster (PDF, up to 10 MB)
        <input type="file" accept=".pdf,application/pdf" required disabled={!!busy} onChange={event => { setFile(event.target.files?.[0] || null); setError(''); setSuccess(''); }} className="w-full min-w-0 text-sm" />
      </label>
      <p className="text-xs text-slate-500 dark:text-slate-400">Include names and schedule details only. Uploading a PDF does not assign accounts; use Assign Applicants to give students access to this session.</p>
      <button type="submit" disabled={!!busy || !file} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600"><Upload size={16} />{busy === 'upload' ? 'Uploading...' : 'Upload PDF'}</button>
    </form>}
    {error && <ErrorMessage message={error}><p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p></ErrorMessage>}
    {success && <p role="status" className="text-sm text-green-700 dark:text-green-300">{success}</p>}
  </section>;
}
