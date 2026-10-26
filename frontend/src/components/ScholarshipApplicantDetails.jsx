import { useState } from 'react';
import { openPrivateDocument } from '../services/documentFile';

import { applicantAnswers } from '../services/scholarshipApplication';

export default function ScholarshipApplicantDetails({ application }) {
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  if (!application?.application_details && !application?.supporting_document_name && !application?.submitted_requirements?.length) return null;
  return <section className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
    <h3 className="font-bold">Applicant answers</h3>
    <dl className="grid gap-3 sm:grid-cols-2">{applicantAnswers(application.application_details).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}</dl>
    {(application.submitted_requirements || []).map((document) => <button key={document.index} type="button" disabled={opening} className="block break-all text-left text-sm font-semibold text-blue-700 underline dark:text-blue-300" onClick={async () => {
      setOpening(true); setError('');
      try { await openPrivateDocument(`/scholarship-applications/${application.id}/requirements/${document.index}`); }
      catch { setError('The required document could not be opened. Please try again.'); }
      finally { setOpening(false); }
    }}>View {document.requirement}: {document.name}</button>)}
    {application.supporting_document_name && <button type="button" disabled={opening} className="break-all text-sm font-semibold text-blue-700 underline dark:text-blue-300" onClick={async () => {
      setOpening(true); setError('');
      try { await openPrivateDocument(`/scholarship-applications/${application.id}/attachment`); }
      catch { setError('The attachment could not be opened. Please try again.'); }
      finally { setOpening(false); }
    }}>{opening ? 'Opening...' : `View attachment: ${application.supporting_document_name}`}</button>}
    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
  </section>;
}
