import { useRef, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import { registrationPayload } from '../../services/registrationPayload';
import StudentIdentityFields from '../../components/forms/StudentIdentityFields';
import { studentTypes } from '../../services/studentTypes';
import SchoolIdPreview from '../../components/SchoolIdPreview';

const button = 'rounded-xl bg-[#123B5D] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';
const field = 'w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-800';
const failureText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || 'The request could not be completed. Check your connection and try again.';

function IdentitySubmission({ identity, existingLrn, onSubmitted }) {
  const [values, setValues] = useState({ student_type: identity?.student_type || '', lrn: identity?.lrn || existingLrn || '', tmc_student_number: identity?.tmc_student_number || '', previous_school: identity?.previous_school || '', school_id: null });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const lock = useRef(false);
  const submit = async (event) => {
    event.preventDefault(); if (lock.current || submitted) return;
    lock.current = true; setBusy(true); setError('');
    try { await api.post('/applicant/verification', registrationPayload(values)); setSubmitted(true); await onSubmitted(); }
    catch (failure) { setError(failureText(failure)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-4"><StudentIdentityFields value={values} onChange={setValues} disabled={busy || submitted} lockedLrn={Boolean(identity)} />
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    {submitted && <p role="status" className="text-sm">School identity submitted. Refresh verification status to see the pending review.</p>}
    <button disabled={busy || submitted} className={button}>{busy ? 'Submitting...' : submitted ? 'Submitted for review' : 'Submit school identity for review'}</button></form>;
}

export default function Verification() {
  const { user, verification, verificationError, refreshVerification } = useAuth();
  const [code, setCode] = useState(''), [busy, setBusy] = useState(''), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [showId, setShowId] = useState(false);
  const lock = useRef(false);
  const request = async (action) => {
    if (lock.current) return;
    lock.current = true; setBusy(action); setMessage(''); setError('');
    try {
      const { data } = await api.post(`/auth/email-verification/${action}`, action === 'verify' ? { code } : {});
      setMessage(data.message); if (action === 'verify') { setCode(''); await refreshVerification(); }
    } catch (failure) { setError(failureText(failure)); }
    finally { lock.current = false; setBusy(''); }
  };
  if (!verification) return <div className="ep-card rounded-2xl p-6" role="status">{verificationError || 'Loading verification status...'}{verificationError && <button className={`${button} ml-3`} onClick={refreshVerification}>Retry</button>}</div>;
  const identity = verification.identity;
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-[#123B5D] dark:text-white">Account Verification</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">One account per student. Verify your email and submit your school identity for administrator review.</p></header>
    <div role="status" className={`rounded-xl p-4 text-sm ${verification.can_apply ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100' : 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100'}`}>{verification.can_apply ? 'Your account is verified. You can apply when the admission or scholarship requirements are met.' : 'Browsing is available. Applications are locked until both checks are complete.'}</div>
    <section className="ep-card space-y-4 rounded-2xl p-5 sm:p-6"><h2 className="text-lg font-bold">1. Verify your email</h2><p className="break-all text-sm">{verification.email} — {verification.email_verified ? 'Verified' : 'Not verified'}</p>
      {!verification.email_verified && <><p className="text-sm">Request a six-digit code. It expires after 10 minutes; wait at least 60 seconds between requests. A new code replaces the previous code.</p><button type="button" disabled={Boolean(busy)} onClick={() => request('send')} className={button}>{busy === 'send' ? 'Sending...' : 'Send / resend email code'}</button>
        <form onSubmit={(event) => { event.preventDefault(); void request('verify'); }} className="flex flex-wrap items-end gap-3"><label className="block text-sm font-semibold">Email verification code<input aria-label="Email verification code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} disabled={Boolean(busy)} className={`${field} mt-2 max-w-64 tracking-widest`} /></label><button disabled={Boolean(busy)} className={button}>{busy === 'verify' ? 'Verifying...' : 'Verify email'}</button></form></>}
      {message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    </section>
    <section className="ep-card space-y-4 rounded-2xl p-5 sm:p-6"><h2 className="text-lg font-bold">2. School identity review</h2>
      {identity && <><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Student type</dt><dd>{studentTypes[identity.student_type]}</dd></div><div><dt className="font-semibold">Review status</dt><dd className="capitalize">{identity.status}</dd></div><div><dt className="font-semibold">LRN</dt><dd>{identity.lrn}</dd></div>{identity.tmc_student_number && <div><dt className="font-semibold">TMC student number</dt><dd>{identity.tmc_student_number}</dd></div>}<div><dt className="font-semibold">School</dt><dd>{identity.previous_school}</dd></div>{identity.student_type === 'old' && <div><dt className="font-semibold">Existing program</dt><dd>{identity.academic_program?.name || 'Awaiting administrator confirmation'}</dd></div>}</dl>
        {identity.feedback && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100"><strong>Administrator feedback:</strong> {identity.feedback}</p>}
        <button type="button" className="text-sm font-semibold underline" onClick={() => setShowId(!showId)}>{showId ? 'Hide school ID' : 'View submitted school ID'}</button>{showId && <SchoolIdPreview key={identity.revision} path="/applicant/verification/file" />}</>}
      {(!identity || identity.status === 'rejected') ? <IdentitySubmission key={identity?.revision || 'new'} identity={identity} existingLrn={user?.applicant?.lrn} onSubmitted={refreshVerification} /> : <p className="text-sm">{identity.status === 'pending' ? 'Your school identity is awaiting administrator review. Check this page for feedback. The LRN stays linked to this account.' : 'The administrator has verified your school identity.'}</p>}
      <button type="button" onClick={refreshVerification} className="text-sm font-semibold underline">Refresh verification status</button>
    </section>
  </div>;
}
