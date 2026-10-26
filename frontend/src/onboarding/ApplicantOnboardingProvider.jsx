import ErrorMessage from '../components/ui/ErrorMessage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { OnboardingContext } from './onboardingContext';
import { TOUR_STEPS, isExamRoute, stepIndex } from './applicantTour';
import { onboardingService } from '../services/onboardingService';
import ApplicantTourOverlay from './ApplicantTourOverlay';
import './onboarding.css';

export default function ApplicantOnboardingProvider({ children, setMobileMenuOpen }) {
  const [data, setData] = useState(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [examPending, setExamPending] = useState(false);
  const alive = useRef(true);
  const saving = useRef(false);
  const opening = useRef(false);
  const requestSequence = useRef(0);
  const invalidateRequests = useCallback(() => { requestSequence.current++; }, []);
  const channel = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const blocked = !data || data.exam_active || examPending || isExamRoute(pathname) || pathname === '/applicant/verification';
  const state = data?.state;
  const index = stepIndex(state?.current_step_id);

  const refresh = useCallback(async () => {
    if (saving.current) return null;
    const sequence = ++requestSequence.current;
    try {
      const latest = await onboardingService.get();
      if (!alive.current || sequence !== requestSequence.current) return null;
      setData(latest);
      if (latest.state?.status !== 'in_progress') setActive(false);
      setExamPending(false);
      return latest;
    } catch {
      if (alive.current && sequence === requestSequence.current) {
        setData(null);
        setActive(false);
        setError('Tutorial availability could not be checked. Your progress has not been changed. Try again from Settings.');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    const timer = setTimeout(refresh, 0);
    const check = () => { if (document.visibilityState === 'visible') refresh(); };
    const interval = setInterval(check, 15000);
    const examStarted = () => {
      setExamPending(true); setActive(false); setMobileMenuOpen(false);
      channel.current?.postMessage({ type: 'exam-starting' });
    };
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('edupath:exam-starting', examStarted);
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('edupath-onboarding');
      channel.current.onmessage = (event) => {
        setActive(false);
        if (event.data?.type === 'exam-starting') setExamPending(true);
        else refresh();
      };
    }
    return () => {
      alive.current = false;
      invalidateRequests();
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('edupath:exam-starting', examStarted);
      channel.current?.close();
    };
  }, [refresh, setMobileMenuOpen, invalidateRequests]);

  // A route change into the exam never leaves a pending tutorial behind it.
  useEffect(() => {
    if (isExamRoute(pathname) || data?.exam_active) {
      const timer = setTimeout(() => { setActive(false); setMobileMenuOpen(false); }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, data?.exam_active, setMobileMenuOpen]);

  const write = async (operation, values = {}) => {
    if (saving.current) return null;
    saving.current = true;
    requestSequence.current++;
    setBusy(true);
    setError('');
    try {
      const latest = await operation({ tutorial_version: data?.tutorial_version, revision: state?.revision ?? 0, ...values });
      if (!alive.current) return null;
      setData(latest);
      channel.current?.postMessage('changed');
      return latest;
    } catch (failure) {
      if (!alive.current) return null;
      if (failure.response?.status === 409) {
        setActive(false);
        // The failed write is finished; a fresh read may now replace its state.
        saving.current = false;
        await refresh();
      }
      const status = failure.response?.status;
      setError(status && status < 500 ? (failure.response?.data?.message || 'Tutorial progress was not saved. Try again.') : 'Tutorial progress was not saved. Check your connection and try again.');
      return null;
    } finally {
      saving.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const open = async (restart = false) => {
    if (saving.current || opening.current) return;
    opening.current = true;
    try {
    // Always recheck account and exam state; never open from cached eligibility.
    setError('');
    const latest = await refresh();
    if (!latest || latest.exam_active || isExamRoute(pathname)) return;
    // Use the freshly loaded revision, even if another tab changed it.
    const operation = restart || !latest.state || ['completed', 'skipped'].includes(latest.state.status) ? onboardingService.restart : onboardingService.save;
    const result = await write(operation, { tutorial_version: latest.tutorial_version, revision: latest.state?.revision ?? 0, status: 'in_progress', current_step_id: latest.state?.current_step_id || 'welcome' });
    if (!result) return;
    const step = TOUR_STEPS[stepIndex(result.state.current_step_id)];
    navigate(step.path);
    setDismissed(false);
    setActive(true);
    } finally {
      opening.current = false;
    }
  };

  const close = () => { setActive(false); setDismissed(true); setMobileMenuOpen(false); };
  const move = async (nextIndex) => {
    const step = TOUR_STEPS[nextIndex];
    if (!step) return;
    const result = await write(onboardingService.save, { status: 'in_progress', current_step_id: step.id });
    if (!result) return;
    // Profile can teach a real navigation click; Next also opens it safely.
    if (step.id !== 'profile') navigate(step.path);
  };
  const end = async (status) => {
    const result = await write(onboardingService.save, { status, current_step_id: state?.current_step_id || 'welcome' });
    if (result) close();
  };
  const offer = !active && !dismissed && !blocked && ['not_started', 'in_progress'].includes(state?.status);

  return (
    <OnboardingContext.Provider value={{ state, busy, error, available: !blocked, start: () => open(true), resume: () => open(false), refresh }}>
      {children}
      {active && !blocked && <ApplicantTourOverlay step={TOUR_STEPS[index]} index={index} pathname={pathname} busy={busy} error={error} setMobileMenuOpen={setMobileMenuOpen} onBack={() => move(index - 1)} onNext={() => {
        if (TOUR_STEPS[index].id === 'profile' && pathname !== TOUR_STEPS[index].path) navigate(TOUR_STEPS[index].path);
        else move(index + 1);
      }} onSkip={() => end('skipped')} onFinish={() => end('completed')} onClose={close} />}
      {offer && createPortal(
        <section className="ep-tour-offer ep-card" aria-label="Applicant tutorial invitation">
          <img src="/images/onboarding/welcome.png" alt="" />
          <div><p className="font-bold text-[#123B5D] dark:text-white">{state.status === 'in_progress' ? 'Continue your tour?' : 'Welcome to EduPath'}</p>
            <p className="mt-1 text-sm">Take a quick guided tour. No application submission is required.</p>
            {error && <ErrorMessage message={error}><p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p></ErrorMessage>}
            <div className="ep-tour-controls"><button disabled={busy} onClick={() => open(false)}>{state.status === 'in_progress' ? 'Resume' : 'Start Tour'}</button><button disabled={busy} onClick={() => end('skipped')}>Skip</button><button disabled={busy} onClick={() => setDismissed(true)}>Later</button></div>
          </div>
        </section>, document.body)}
    </OnboardingContext.Provider>
  );
}
