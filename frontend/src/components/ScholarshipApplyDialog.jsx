import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import ModalPortal from './ui/ModalPortal';
import { ConfirmationDialog } from './ui/ConfirmDialog';
import { applicantAnswers, incomeLabels } from '../services/scholarshipApplication';

const field = 'mt-1 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800';
const button = 'rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 dark:border-slate-600';
const years = ['Incoming Freshman', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const empty = { academic_average: '', grading_scale: '', year_level: '', income_range: '', household_size: '', motivation: '', additional_notes: '' };

export default function ScholarshipApplyDialog({ scholarship, onClose, onSubmitted }) {
  const { verification } = useAuth();
  const [answers, setAnswers] = useState(empty);
  const [file, setFile] = useState(null);
  const [requiredFiles, setRequiredFiles] = useState({});
  const requiredDocuments = scholarship.required_documents || [];
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [admission, setAdmission] = useState('loading');
  const [discard, setDiscard] = useState(false);
  const lock = useRef(false);
  const body = useRef(null);
  const form = useRef(null);
  const fileInput = useRef(null);
  const dirty = Boolean(Object.keys(requiredFiles).length || file || Object.values(answers).some(Boolean));
  useEffect(() => {
    if (!dirty) return;
    const preventLoss = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [dirty]);
  useEffect(() => {
    let active = true;
    api.get('/applicant/admissions').then(({ data }) => {
      if (active) setAdmission((Array.isArray(data) ? data : data.data || []).some((item) => item.status === 'approved') ? 'approved' : 'not_approved');
    }).catch(() => { if (active) setAdmission('unavailable'); });
    return () => { active = false; };
  }, []);
  const close = () => { if (!lock.current) { if (dirty) setDiscard(true); else onClose(); } };
  const change = (event) => setAnswers((current) => ({ ...current, [event.target.name]: event.target.value }));
  const move = (next) => { if (next && requiredDocuments.some((_, index) => !requiredFiles[index])) { setError('Attach every required scholarship document before reviewing.'); return; } setReview(next); setError(''); body.current?.scrollTo({ top: 0 }); };
  const submit = async () => {
    if (lock.current || !review || !verification?.can_apply) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const payload = new FormData();
      Object.entries(answers).forEach(([key, value]) => payload.append(`application_details[${key}]`, value));
      if (file) payload.append('supporting_document', file);
      requiredDocuments.forEach((_, index) => { if (requiredFiles[index]) payload.append(`requirement_documents[${index}]`, requiredFiles[index]); });
      await api.post(`/applicant/scholarships/${scholarship.id}/apply`, payload);
      onSubmitted(scholarship);
    } catch (failure) {
      setError(Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || 'Submission could not be confirmed. Your answers are kept here. Check My Applications before retrying if the connection was interrupted.');
    } finally { lock.current = false; setBusy(false); }
  };
  const deadline = scholarship.application_end_at
    ? new Date(scholarship.application_end_at).toLocaleString('en-PH')
    : scholarship.application_end ? String(scholarship.application_end).slice(0, 10) : 'No deadline specified';
  const blocked = !verification?.can_apply || (Boolean(scholarship.admission_approval_required) && !verification?.scholarship_admission_satisfied && admission !== 'approved');
  return <>
    <ModalPortal onEscape={close}>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-3 sm:p-6">
        <section role="dialog" aria-modal="true" aria-labelledby="scholarship-apply-title" aria-busy={busy} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-2xl bg-white text-slate-800 shadow-xl dark:bg-slate-900 dark:text-slate-100">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-700"><div><h2 id="scholarship-apply-title" className="text-xl font-bold">{review ? 'Review application' : 'Apply for scholarship'}</h2><p className="mt-1 text-sm">{scholarship.name}</p></div><button aria-label="Close application" type="button" disabled={busy} onClick={close} className={button}>Close</button></header>
          <div ref={body} className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5">
            <section className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              {verification?.identity?.student_type === 'old' && <p className="text-sm">Existing TMC program: {verification.identity.academic_program?.name || 'Awaiting confirmation'}. Administrator-confirmed enrollment satisfies the scholarship admission prerequisite.</p>}
              <p className="font-semibold">Deadline: {deadline}</p>
              <p className="text-sm">Admission: {verification?.identity?.student_type === 'old' && verification?.scholarship_admission_satisfied ? 'Satisfied by verified existing TMC enrollment' : admission === 'loading' ? 'Checking...' : admission === 'approved' ? 'Approved admission on record' : admission === 'unavailable' ? 'Could not check admission. Close and reopen to retry.' : scholarship.admission_approval_required ? 'Approved admission is required before applying.' : 'No approved admission on record; this scholarship does not require it.'}</p>
              <div><h3 className="font-semibold">Eligibility</h3><p className="whitespace-pre-wrap text-sm">{scholarship.eligibility || 'Contact the college for eligibility details.'}</p></div>
              <div><h3 className="font-semibold">Requirements</h3><p className="whitespace-pre-wrap text-sm">{scholarship.requirements || 'No document requirements specified.'}</p></div>
              <div><h3 className="font-semibold">What happens next</h3><ol className="list-inside list-decimal space-y-1 text-sm"><li>Submit your application for college review.</li>{scholarship.requires_online_exam && <li>Wait for scholarship approval and online examination eligibility. Follow the Online Examination instructions when available.</li>}{scholarship.requires_face_to_face_exam && <li>Follow the college&apos;s scheduled entrance-examination assignment and official result release.</li>}<li>Track review updates in My Applications. Application or examination approval does not automatically award a scholarship.</li></ol></div>
            </section>
            {review ? <section className="space-y-4"><dl className="grid gap-4 sm:grid-cols-2">{applicantAnswers(answers).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}</dl><ul className="space-y-2 text-sm">{requiredDocuments.map((name, index) => <li key={name} className="break-all">{name}: {requiredFiles[index]?.name || 'Missing'}</li>)}</ul><p className="break-all text-sm">Attachment: {file ? `${file.name} (${Math.ceil(file.size / 1024)} KB)` : 'None selected'}</p><p className="text-sm">Check your answers before submitting. Submission and the selected attachment are saved together.</p></section> : <form id="scholarship-answers" ref={form} onSubmit={(event) => { event.preventDefault(); move(true); }} className="space-y-4">
              <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
                <label className="min-w-0 text-sm font-semibold">Grading scale *<select className={field} name="grading_scale" required value={answers.grading_scale} onChange={change}><option value="">Select grading scale</option><option value="grade_point">Grade point average</option><option value="percentage">Percentage</option></select></label>
                <label className="min-w-0 text-sm font-semibold">Current GWA / GPA *<input className={field} name="academic_average" type="number" step="any" min="0" max="100" required value={answers.academic_average} onChange={change} /><span className="mt-1 block text-xs font-normal">Enter your average as reported on your academic record.</span></label>
                <label className="min-w-0 text-sm font-semibold">Year level *<select className={field} name="year_level" required value={answers.year_level} onChange={change}><option value="">Select year level</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
                <label className="min-w-0 text-sm font-semibold">Annual household income *<select className={field} name="income_range" required value={answers.income_range} onChange={change}><option value="">Select annual income range</option>{Object.entries(incomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="min-w-0 text-sm font-semibold">Household size *<input className={field} name="household_size" type="number" min="1" max="1000" step="1" required value={answers.household_size} onChange={change} /><span className="mt-1 block text-xs font-normal">Total people in your household, including yourself.</span></label>
              </fieldset>
              <label className="block text-sm font-semibold">Motivation statement *<textarea className={field} name="motivation" required minLength={15} maxLength={1000} rows={4} value={answers.motivation} onChange={change} placeholder="Explain why you are applying and how this scholarship would support your education." /></label>
              <label className="block text-sm font-semibold">Additional notes (optional)<textarea className={field} name="additional_notes" maxLength={2000} rows={2} value={answers.additional_notes} onChange={change} /></label>
              {requiredDocuments.length > 0 && <fieldset className="space-y-3"><legend className="font-semibold">Required scholarship documents</legend><p className="text-xs">PDF, JPG or PNG. Up to 5 MB each and 25 MB combined with any optional attachment.</p>{requiredDocuments.map((name, index) => <label key={name} className="block text-sm font-semibold">{name} *<input className={field} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected && (selected.size === 0 || selected.size > 5 * 1024 * 1024 || !/\.(pdf|jpe?g|png)$/i.test(selected.name))) { setError('Choose a non-empty PDF, JPG or PNG file up to 5 MB.'); event.target.value = ''; setRequiredFiles((current) => { const next = { ...current }; delete next[index]; return next; }); }
                else { setRequiredFiles((current) => { const next = { ...current }; if (selected) next[index] = selected; else delete next[index]; return next; }); setError(''); }
              }} />{requiredFiles[index] && <span className="block break-all font-normal">Selected: {requiredFiles[index].name}</span>}</label>)}</fieldset>}
              <label className="block text-sm font-semibold">Supporting document (optional)<input ref={fileInput} className={field} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected && (selected.size > 5 * 1024 * 1024 || !/\.(pdf|jpe?g|png)$/i.test(selected.name))) { setError('Choose a PDF, JPG or PNG file up to 5 MB.'); event.target.value = ''; setFile(null); }
                else { setFile(selected || null); setError(''); }
              }} /><span className="mt-1 block text-xs font-normal">PDF, JPG or PNG, up to 5 MB. Saved privately with this scholarship application.</span></label>
              {file && <div className="flex flex-wrap items-center gap-3 text-sm"><p className="min-w-0 break-all">Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)</p><button type="button" className={button} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }}>Remove selected file</button></div>}
            </form>}
            {error && <p role="alert" className="whitespace-pre-wrap rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
          </div>
          <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-4 dark:border-slate-700"><button className={button} disabled={busy} onClick={() => review ? move(false) : close()}>{review ? 'Back to edit' : 'Cancel'}</button>{review ? <button className={`${button} bg-[#123B5D] text-white`} disabled={busy || blocked} onClick={submit}>{busy ? 'Submitting application and attachment...' : 'Submit application'}</button> : <button form="scholarship-answers" type="submit" className={`${button} bg-[#123B5D] text-white`} disabled={busy || blocked}>Review application</button>}</footer>
        </section>
      </div>
    </ModalPortal>
    <ConfirmationDialog open={discard} title="Discard your application draft?" message="Your unsent answers and selected attachment will be cleared." confirmLabel="Discard draft" cancelLabel="Keep editing" onCancel={() => setDiscard(false)} onConfirm={onClose} />
  </>;
}
