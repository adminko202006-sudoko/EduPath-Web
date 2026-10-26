import ErrorMessage from './ui/ErrorMessage';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import api from '../services/api';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { hasRecordedEntranceScore, isFheScholarship, summarizeEntranceExamRecords } from '../utils/entranceExamReview';

export default function EntranceExamReviewPanel({ application }) {
  const applicantId = application.applicant_id ?? application.applicant?.id;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!applicantId) return;
    const abort = new AbortController();
    api.get(`/admin/applicants/${applicantId}`, { signal: abort.signal })
      .then(response => {
        const assignments = response.data?.data?.exam_assignments;
        if (response.data?.success === false || !Array.isArray(assignments)) {
          throw new Error('The entrance-exam records could not be verified.');
        }
        if (!abort.signal.aborted) setRecords(assignments);
      })
      .catch(failure => {
        if (!abort.signal.aborted) setError(failure.response?.data?.message || 'Unable to verify entrance-exam records. Please retry.');
      })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [applicantId, revision]);

  const refresh = () => {
    setLoading(true);
    setError('');
    setRevision(current => current + 1);
  };
  useAutoRefresh(refresh);
  const summary = summarizeEntranceExamRecords(records);
  const hasReleasedPass = records.some(record => record.status === 'completed'
    && record.entrance_exam?.results_released_at && hasRecordedEntranceScore(record)
    && Number(record.score) >= 40 && Number(record.score) <= 100);

  return <section aria-label="Face-to-face entrance examination review" className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-bold text-[#123B5D] dark:text-amber-100"><ClipboardCheck size={18} /> Face-to-face entrance examination</h3>
      
    </div>
    <p className="text-sm text-slate-700 dark:text-slate-200">Review the applicant's scheduled entrance-exam attendance, score, and official release before recording a scholarship decision.</p>
    {!applicantId ? <p role="alert" className="text-sm text-red-700 dark:text-red-300">This application is missing its applicant link. Entrance-exam records cannot be verified.</p>
      : loading ? <p role="status" className="text-sm">Loading entrance-exam records...</p>
        : error ? <ErrorMessage message={error}><p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p></ErrorMessage>
          : <>
            {isFheScholarship(application.scholarship) && <p className={`text-sm font-bold ${hasReleasedPass ? 'text-green-800 dark:text-green-300' : 'text-amber-900 dark:text-amber-200'}`}>{hasReleasedPass ? 'Released passing result found. Admin may continue the FHE review.' : 'FHE prerequisite pending: no officially released passing result found.'}</p>}
            <p className="text-sm font-semibold">{summary.total === 0 ? 'No entrance-exam record found.' : summary.completedScored === 0 ? 'No completed entrance-exam result with a recorded score.' : `${summary.completedScored} completed, scored result(s); ${summary.releasedScored} officially released.`}</p>
            {records.map(record => <article key={record.id} className="space-y-2 rounded-lg border border-amber-200 bg-white/80 p-3 dark:border-amber-900 dark:bg-slate-900/80">
              <h4 className="font-semibold">{record.entrance_exam?.title || 'Entrance examination'}</h4>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500 dark:text-slate-400">Attendance</dt><dd className="capitalize">{record.status || 'Not recorded'}</dd></div>
                <div><dt className="text-slate-500 dark:text-slate-400">Recorded score</dt><dd>{hasRecordedEntranceScore(record) ? String(record.score) : 'Not recorded'}</dd></div>
                <div><dt className="text-slate-500 dark:text-slate-400">Exam date</dt><dd>{record.entrance_exam?.exam_date?.slice(0, 10) || 'Not recorded'}</dd></div>
                <div><dt className="text-slate-500 dark:text-slate-400">Official results</dt><dd>{record.entrance_exam?.results_released_at ? 'Released' : 'Not released'}</dd></div>
              </dl>
              {record.remarks && <p className="whitespace-pre-line break-words text-sm">Exam remarks: {record.remarks}</p>}
            </article>)}
            <p className="text-sm text-slate-600 dark:text-slate-300">{isFheScholarship(application.scholarship) ? 'FHE approval and awarding require a completed, officially released result of at least 40/100. A scheduled assignment or an unreleased score does not meet this requirement. Passing never automatically grants a scholarship.' : 'A scheduled assignment is not a completed result. Review attendance, score, and official release under the scholarship’s existing requirements before recording a decision.'}</p>
          </>}
    <Link to="/admin/exams" className="inline-block text-sm font-semibold text-[#123B5D] underline dark:text-amber-200">Manage face-to-face entrance exams</Link>
  </section>;
}
