import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function VerificationBanner() {
  const { verification, verificationError, refreshVerification } = useAuth();
  if (verification?.can_apply) return null;
  return <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-slate-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-slate-100" role="status">
    <p className="font-bold">Complete account verification before applying</p>
    <p className="mt-1">{verificationError || 'You can browse EduPath. Admission and scholarship applications require email verification and administrator approval of your school identity.'}</p>
    <Link to="/applicant/verification" className="mt-2 inline-block font-bold underline">Open Account Verification</Link>
    {verificationError && <button type="button" onClick={refreshVerification} className="ml-4 font-semibold underline">Retry</button>}
  </div>;
}
