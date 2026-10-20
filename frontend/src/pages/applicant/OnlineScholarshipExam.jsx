import ErrorMessage from '../../components/ui/ErrorMessage';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Play,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import { ConfirmationDialog } from '../../components/ui/ConfirmDialog';
import { onlineExamClock } from '../../services/onlineExamClock';

const EXAM_URL = '/applicant/online-exam';
const REQUIRED_QUESTION_COUNT = 100;
const DEFAULT_SECONDS_PER_QUESTION = 60;
const DEFAULT_PASSING_SCORE = 50;

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString();
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.question_id?.[0] ||
  error?.response?.data?.errors?.option_id?.[0] ||
  'Something went wrong. Please try again.';

const OnlineScholarshipExam = () => {
  const { token } = useAuth();

  const [overview, setOverview] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const [error, setError] = useState('');
  const [accessMessage, setAccessMessage] = useState('');
  const accessVersion = useRef(0);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(0);

  const autoSubmitStarted = useRef(false);
  const loadingAttemptRef = useRef(false);
  const mutationLock = useRef(false);
  const readEpoch = useRef(0);
  const clockAnchor = useRef(null);
  const syncClock = useCallback((value) => {
    const server = Date.parse(value?.server_time);
    const time = Number.isFinite(server) ? server : Date.now();
    clockAnchor.current = { time, monotonic: performance.now() };
    setNow(time);
  }, []);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const handleExamError = useCallback((requestError) => {
    if (requestError?.response?.data?.code !== 'ONLINE_EXAM_SCHOLARSHIP_APPROVAL_REQUIRED') return false;
    accessVersion.current += 1;
    const message = getErrorMessage(requestError);
    setAccessMessage(message);
    setAttempt(null);
    setQuestions([]);
    setNotice('');
    setError('');
    setOverview((previous) => previous ? { ...previous, eligible: false, reason: message } : previous);
    return true;
  }, []);

  /*
   * Load a specific attempt and its assigned questions.
   */
  const loadAttempt = useCallback(
    async (attemptId) => {
      if (!attemptId) {
        setAttempt(null);
        setQuestions([]);
        return;
      }

      const version = accessVersion.current;
      const epoch = readEpoch.current;
      const response = await api.get(
        `${EXAM_URL}/attempts/${attemptId}/questions`,
        { headers }
      );

      if (version !== accessVersion.current || epoch !== readEpoch.current || mutationLock.current) return;
      const data = response.data?.data;
      const loadedAttempt = data?.attempt || null;
      const loadedQuestions = Array.isArray(data?.questions)
        ? data.questions
        : [];

      setAttempt(loadedAttempt);
      setQuestions(loadedQuestions);

      // Refresh the displayed clock whenever an attempt is loaded.
      syncClock(loadedAttempt);

      return {
        attempt: loadedAttempt,
        questions: loadedQuestions,
      };
    },
    [headers, syncClock]
  );

  /*
   * Load the applicant's examination overview and history.
   */
  const refreshOverview = useCallback(
    async (showLoader = false) => {
      if (!token) {
        setOverview(null);
        setAttempt(null);
        setQuestions([]);
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await api.get(EXAM_URL, { headers });
        const data = response.data?.data || null;

        setOverview(data);

        if (data?.active_attempt_id) {
          await loadAttempt(data.active_attempt_id);
        } else {
          setAttempt(null);
          setQuestions([]);
          autoSubmitStarted.current = false;
        }

        setError('');
      } catch (requestError) {
        if (!handleExamError(requestError)) setError(getErrorMessage(requestError));
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [token, headers, loadAttempt, handleExamError]
  );

  /*
   * Initial load and reload when the authenticated user changes.
   */
  useEffect(() => {
    const initialLoad = window.setTimeout(() => refreshOverview(true), 0);
    return () => window.clearTimeout(initialLoad);
  }, [refreshOverview]);

  /*
   * Update the visible timer while an examination is in progress.
   * The backend remains responsible for enforcing the official time.
   */
  useEffect(() => {
    if (attempt?.status !== 'in_progress') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const anchor = clockAnchor.current;
      setNow(anchor ? anchor.time + performance.now() - anchor.monotonic : Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, [attempt?.id, attempt?.status]);

  // Revalidate a running exam periodically and when returning to this tab.
  useEffect(() => {
    if (attempt?.status !== 'in_progress' || !attempt?.id) return undefined;
    const check = async () => {
      if (loadingAttemptRef.current || mutationLock.current) return;
      loadingAttemptRef.current = true;
      try { await loadAttempt(attempt.id); }
      catch (requestError) { if (!handleExamError(requestError)) setError(getErrorMessage(requestError)); }
      finally { loadingAttemptRef.current = false; }
    };
    const timer = window.setInterval(check, 10000);
    window.addEventListener('focus', check);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', check); };
  }, [attempt?.id, attempt?.status, loadAttempt, handleExamError]);

  const questionCount = Number(attempt?.question_count) || 0;
  const { questionIndex, questionRemaining, overallRemaining, activeIndex, reviewing } = onlineExamClock(attempt, now);

const currentQuestion =
  questions.length > 0 &&
  Number(questions[0].question_number) === questionIndex + 1
    ? questions[0]
    : null;

const answeredCount = Math.min(
  questionCount,
  Math.max(0, Number(attempt?.answered_count) || 0)
);

  /*
   * Submit an attempt.
   * The ref prevents duplicate submissions from timer effects or clicks.
   */
  const submitExam = useCallback(
    async (automatic = false) => {
      if (
        !attempt?.id ||
        attempt.status !== 'in_progress' ||
        submitting ||
        mutationLock.current ||
        autoSubmitStarted.current
      ) {
        return;
      }

      autoSubmitStarted.current = true;
      setSubmitting(true);
      setError('');

      setNotice(
        automatic
          ? 'The examination time has ended. Submitting your answers…'
          : ''
      );

      try {
        await api.post(
          `${EXAM_URL}/attempts/${attempt.id}/submit`,
          {},
          { headers }
        );

        setNotice(
          'Your examination has been submitted. Your result will appear after the college officially releases it.'
        );

        setAttempt(null);
        setQuestions([]);

        await refreshOverview(false);
      } catch (requestError) {
        autoSubmitStarted.current = false;
        await refreshOverview(false);
        if (!handleExamError(requestError)) setError(getErrorMessage(requestError));
      } finally {
        setSubmitting(false);
      }
    },
    [
      attempt,
      submitting,
      headers,
      refreshOverview,
      handleExamError,
    ]
  );

  useEffect(() => {
    if (attempt?.status !== 'in_progress' || overallRemaining !== 0 || submitting) return undefined;
    const timer = window.setTimeout(() => submitExam(true), 0);
    return () => window.clearTimeout(timer);
  }, [attempt?.status, overallRemaining, submitting, submitExam]);


/*
 * Load the server-authorized question whenever the official question
 * window changes. The server remains authoritative for question access.
 */
useEffect(() => {

  if (
    attempt?.status !== 'in_progress' ||
    !attempt?.id ||
    questionCount <= 0
  ) {
    return undefined;
  }

  const expectedQuestionNumber = questionIndex + 1;
  const loadedQuestion = questions[0];

  if (
    loadedQuestion &&
    Number(loadedQuestion.question_number) === expectedQuestionNumber
  ) {
    return undefined;
  }

  if (loadingAttemptRef.current || mutationLock.current) {
    return undefined;
  }

  let cancelled = false;
  loadingAttemptRef.current = true;

  loadAttempt(attempt.id)
    .then(() => {
      if (!cancelled) {
        setError('');
      }
    })
    .catch((requestError) => {
      if (!cancelled) {
        if (!handleExamError(requestError)) setError(getErrorMessage(requestError));
      }
    })
    .finally(() => {
      loadingAttemptRef.current = false;
    });

  return () => {
    cancelled = true;
  };
}, [
  attempt?.id,
  attempt?.status,
  questionCount,
  questionIndex,
  questions,
  loadAttempt,
  handleExamError,
]);
  /*
   * Start a new examination.
   */
  const startExam = async () => {
    if (starting) {
      return;
    }

    setStarting(true);
    setError('');
    setNotice('');
    autoSubmitStarted.current = false;

    try {
      window.dispatchEvent(new Event('edupath:exam-starting'));
      await api.post(`${EXAM_URL}/start`, {}, { headers });
      await refreshOverview(false);
    } catch (requestError) {
      if (!handleExamError(requestError)) setError(getErrorMessage(requestError));
      await refreshOverview(false);
    } finally {
      setStarting(false);
    }
  };

  /*
   * Save the applicant's selected answer.
   */
  const selectAnswer = async (question, option) => {
    if (
      !attempt?.id ||
      attempt.status !== 'in_progress' ||
      saving ||
      mutationLock.current ||
      submitting ||
      !currentQuestion ||
      question.id !== currentQuestion.id ||
      questionRemaining <= 0 ||
      overallRemaining === null ||
      overallRemaining <= 0
    ) {
      return;
    }

    mutationLock.current = true;
    readEpoch.current++;
    setSaving(true);
    setError('');
    setNotice('');

    const alreadyAnswered = question.selected_option_id != null;

    try {
      const response = await api.post(
        `${EXAM_URL}/attempts/${attempt.id}/answers`,
        {
          question_id: question.id,
          option_id: option.id,
          ...(attempt.navigation_enabled ? { expected_revision: attempt.navigation_revision } : {}),
        },
        { headers }
      );

      if (response.data?.data?.attempt) {
        setAttempt(response.data.data.attempt);
        syncClock(response.data.data.attempt);
      }

      setQuestions((previous) =>
        previous.map((item) =>
          item.id === question.id
            ? {
                ...item,
                selected_option_id: option.id,
              }
            : item
        )
      );

      if (!alreadyAnswered && !response.data?.data?.attempt) {
        setAttempt((previous) =>
          previous
            ? {
                ...previous,
answered_count: Math.min(
  questionCount,
  (Number(previous.answered_count) || 0) + 1
),
              }
            : previous
        );
      }
    } catch (requestError) {
      if (!handleExamError(requestError)) setError(getErrorMessage(requestError));
    } finally {
      readEpoch.current++;
      mutationLock.current = false;
      setSaving(false);
    }
  };

  const navigateQuestion = async (direction) => {
    if (!attempt?.navigation_enabled || !currentQuestion || mutationLock.current || submitting) return;
    mutationLock.current = true; readEpoch.current++; setNavigating(true); setError(''); setNotice('');
    try {
      const response = await api.post(`${EXAM_URL}/attempts/${attempt.id}/navigate`, {
        direction, question_id: currentQuestion.id, expected_revision: attempt.navigation_revision,
      }, { headers });
      const data = response.data.data;
      setAttempt(data.attempt); setQuestions(data.questions); syncClock(data.attempt);
    } catch (requestError) {
      if (!handleExamError(requestError)) setError(getErrorMessage(requestError));
    } finally {
      readEpoch.current++; mutationLock.current = false; setNavigating(false);
    }
    // Always recover canonical position after a rejected/stale navigation action.
    try { await loadAttempt(attempt.id); }
    catch (requestError) { if (!handleExamError(requestError)) await refreshOverview(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span>Loading online scholarship examination…</span>
        </div>
      </div>
    );
  }

  const panelClass =
    'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1832]';

  const mutedText = 'text-slate-600 dark:text-slate-400';

  const isAttemptInProgress = attempt?.status === 'in_progress';

  const hasValidQuestionSet =
  questionCount === REQUIRED_QUESTION_COUNT &&
  Number.isInteger(Number(attempt?.seconds_per_question)) &&
  Number(attempt?.seconds_per_question) > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <div className="ep-page-banner rounded-3xl bg-gradient-to-br from-[#123b5d] via-[#164b70] to-[#0f766e] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              EDUPATH · SCHOLARSHIP ASSESSMENT
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Online Scholarship Exam
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Complete the online assessment for eligible Other
              Scholarship applications. Your official result will only
              be shown after it is released by the college.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <BookOpenCheck className="h-9 w-9" />
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={Boolean(accessMessage)}
        title="Examination access unavailable"
        message={accessMessage}
        destructive={false}
        cancelLabel="Close"
        confirmLabel="Check status"
        onCancel={() => setAccessMessage('')}
        onConfirm={() => { setAccessMessage(''); refreshOverview(false); }}
      />
      {error && (
        <ErrorMessage message={error}><div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div></ErrorMessage>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-300"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {isAttemptInProgress ? (
        <div className="space-y-5">
          {!hasValidQuestionSet ? (
            <div
              role="alert"
              className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <h2 className="font-bold">
                Examination configuration needs attention
              </h2>
              <p className="mt-2">
                This attempt does not contain the required 100 assigned
                questions with a valid time limit per question. The exam has not
                been automatically submitted by this page. Please contact
                the college examination administrator to review this
                attempt before continuing.
              </p>
              <button
                type="button"
                onClick={() => refreshOverview(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 font-semibold transition-colors hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh examination
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className={panelClass}>
                  <p className={`text-sm ${mutedText}`}>Question</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {Math.min(questionIndex + 1, questionCount)}
                    <span className="text-base font-medium text-slate-400">
                      {' '}/ {questionCount}
                    </span>
                  </p>
                </div>

                <div className={panelClass}>
                  <p className={`text-sm ${mutedText}`}>
                    Time for this question
                  </p>
                  <p
                    className={`mt-1 flex items-center gap-2 text-2xl font-bold ${
                      questionRemaining <= 10
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    <Clock3 className="h-5 w-5" />
                    {formatTime(questionRemaining)}
                  </p>
                  <p className={`mt-1 text-xs ${mutedText}`}>
                    Overall time remaining: {formatTime(overallRemaining)}
                  </p>
                </div>

                <div className={panelClass}>
                  <p className={`text-sm ${mutedText}`}>Answers saved</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {answeredCount}
                    <span className="text-base font-medium text-slate-400">
                      {' '}/ {questionCount}
                    </span>
                  </p>
                </div>
              </div>

              <div className={panelClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`text-sm ${mutedText}`}>
                      Online examination
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      Question {Math.min(questionIndex + 1, questionCount)}
                    </h2>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {saving
                      ? 'Saving answer…'
                      : 'Answers save automatically'}
                  </span>
                </div>

                <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-[width] duration-300"
                    style={{
                      width: `${
((Math.min(questionIndex + 1, questionCount)) /
  questionCount) *
100
                      }%`,
                    }}
                  />
                </div>

                {currentQuestion ? (
                  <>
                    <p className="text-lg font-semibold leading-8 text-slate-900 dark:text-white">
                      {currentQuestion.question}
                    </p>

                    <div className="mt-6 space-y-3">
                      {(currentQuestion.options || []).map((option, index) => {
                        const selected =
                          Number(currentQuestion.selected_option_id) ===
                          Number(option.id);

                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={
                              saving ||
                              navigating ||
                              submitting ||
                              questionRemaining <= 0 ||
                              overallRemaining <= 0
                            }
                            onClick={() =>
                              selectAnswer(currentQuestion, option)
                            }
                            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected
                                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500 dark:bg-teal-950/40'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0b1832] dark:hover:border-slate-600 dark:hover:bg-slate-900/60'
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                                selected
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {String.fromCharCode(65 + index)}
                            </span>

                            <span className="flex-1 pt-1 text-sm leading-6 text-slate-800 dark:text-slate-200">
                              {option.text}
                            </span>

                            {selected && (
                              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className={mutedText}>
                    No question is available for the current position.
                    Refresh the examination or contact the administrator.
                  </p>
                )}

                {attempt.navigation_enabled && <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <p role="status" className={`text-sm ${mutedText}`}>{reviewing
                    ? `Reviewing question ${questionIndex + 1}. Question ${activeIndex + 1}'s timer keeps running. At 25 seconds you return to it automatically.`
                    : 'Next carries unused time forward. Previous is available only above 25 seconds. Reviewing adds no time.'}</p>
                  <div className="flex flex-wrap justify-between gap-3">
                    <button type="button" disabled={saving || submitting || navigating || !currentQuestion || !attempt.can_previous || questionRemaining <= 25 || questionIndex < 1} onClick={() => navigateQuestion('previous')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600">Previous question</button>
                    <button type="button" disabled={saving || submitting || navigating || !currentQuestion || questionRemaining <= 0 || questionIndex >= questionCount - 1 || (!reviewing && currentQuestion.selected_option_id == null)} onClick={() => navigateQuestion('next')} className="rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{navigating ? 'Loading question…' : 'Next question'}</button>
                  </div>
                </div>}

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <p className={`text-xs leading-5 ${mutedText}`}>
                    The exam advances according to the official timer.
                    Your device cannot pause or extend the examination.
                  </p>

                  <button
                    type="button"
                    disabled={submitting || saving || navigating}
                    onClick={() => {
                      const confirmed = window.confirm(
                        'Submit your examination now? You may not be able to change your answers afterward.'
                      );

                      if (confirmed) {
                        submitExam(false);
                      }
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#123b5d] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0d2f4b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-600"
                  >
                    {submitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {submitting ? 'Submitting…' : 'Submit examination'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className={`text-sm ${mutedText}`}>Questions per exam</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {overview?.question_count ?? REQUIRED_QUESTION_COUNT}
                  </p>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                  <Clock3 className="h-5 w-5" />
                </span>
                <div>
                  <p className={`text-sm ${mutedText}`}>Time per question</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {overview?.seconds_per_question ??
                      DEFAULT_SECONDS_PER_QUESTION}{' '}
                    seconds
                  </p>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <p className={`text-sm ${mutedText}`}>Passing score</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {overview?.passing_score ?? DEFAULT_PASSING_SCORE} / 100
                  </p>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-purple-50 p-3 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  <RefreshCw className="h-5 w-5" />
                </span>
                <div>
                  <p className={`text-sm ${mutedText}`}>
                    Attempts remaining
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {overview?.available_attempts ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Examination instructions
            </h2>

            <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
              {overview?.instructions ||
                'Answer each question within the allotted time. Your answers are saved as you go. Results are displayed only after the college officially releases them.'}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Protected answers
                  </p>
                  <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                    Correct answers and unreleased scores are not shown
                    during the examination.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Timed questions
                  </p>
                  <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                    Each question has its own time limit and the exam
                    cannot be paused.
                  </p>
                </div>
              </div>
            </div>

            {overview?.eligible ? (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900/60 dark:bg-teal-950/25 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-teal-900 dark:text-teal-200">
                    You are eligible to take the examination
                  </p>
                  <p className="mt-1 text-sm text-teal-800 dark:text-teal-300">
                    Question bank: {overview?.question_bank_count ?? 0}{' '}
                    active questions available.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={starting}
                  onClick={startExam}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  {starting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {starting ? 'Starting…' : 'Start examination'}
                </button>
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/25">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Examination unavailable
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-300">
                    {overview?.reason ||
                      'Your account is not currently eligible to begin the examination.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={panelClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Examination history
                </h2>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  Scores are only available after official release.
                </p>
              </div>

              <button
                type="button"
                onClick={() => refreshOverview(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            {Array.isArray(overview?.attempts) &&
            overview.attempts.length > 0 ? (
              <div className="space-y-3">
                {overview.attempts.map((item, index) => {
                  const released = item.results_released_at != null;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Examination attempt {overview.attempts.length - index}
                        </p>
                        <p className={`mt-1 text-xs ${mutedText}`}>
                          Started: {formatDate(item.started_at)}
                        </p>
                        {item.completed_at && (
                          <p className={`mt-1 text-xs ${mutedText}`}>
                            Completed: {formatDate(item.completed_at)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {released ? (
                          <>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                              Score: {item.score ?? '—'} / 100
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                item.passed
                                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                              }`}
                            >
                              {item.passed ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              {item.passed ? 'Passed' : 'Not passed'}
                            </span>
                          </>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            {item.status === 'in_progress'
                              ? 'In progress'
                              : 'Awaiting official result'}
                          </span>
                        )}
                      </div>
                      {released && <div className="w-full border-t border-slate-200 pt-4 dark:border-slate-800">
                        <h3 className="font-semibold">Official online examination result · Attempt #{item.id}</h3>
                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          {[
                            ['Total questions', item.question_count], ['Answered', item.answered_count],
                            ['Unanswered', item.unanswered_count], ['Correct answers', item.correct_count],
                            ['Incorrect answers', item.incorrect_count], ['Passing score', `${item.passing_score ?? DEFAULT_PASSING_SCORE} / 100`],
                            ['Time used', item.duration_seconds == null ? 'Unavailable' : `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s`],
                            ['Official release', formatDate(item.results_released_at)],
                          ].map(([label, value]) => <div key={label}><dt className={mutedText}>{label}</dt><dd className="mt-1 font-semibold">{value ?? 'Unavailable'}</dd></div>)}
                        </dl>
                        <p className="mt-4 whitespace-pre-wrap text-sm">{item.remarks || 'No remarks recorded.'}</p>
                        <p className={`mt-3 text-sm ${mutedText}`}>{item.decision_note || 'This examination result is separate from the final scholarship decision.'}</p>
                      </div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 font-medium text-slate-800 dark:text-slate-200">
                  No examination attempts yet
                </p>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  Your attempts will appear here after you begin.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OnlineScholarshipExam;
