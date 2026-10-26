// Derive presentation from server state; backend timestamps remain authoritative.
export function onlineExamClock(attempt, now) {
  const count = Number(attempt?.question_count) || 0;
  const last = Math.max(0, count - 1);
  const seconds = Math.max(1, Number(attempt?.seconds_per_question) || 60);
  const start = Date.parse(attempt?.started_at);
  const expiry = Date.parse(attempt?.expires_at);
  const clockIndex = Number.isFinite(start) ? Math.min(last, Math.floor(Math.max(0, now - start) / (seconds * 1000))) : 0;
  const active = attempt?.navigation_enabled ? Math.max(Number(attempt.active_question_index) || 0, clockIndex) : clockIndex;
  let deadline = Number.isFinite(start) ? start + (active + 1) * seconds * 1000 : NaN;
  if (Number.isFinite(expiry)) deadline = Math.min(deadline, expiry);
  const remaining = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
  const view = Number(attempt?.current_question_index) || 0;
  const reviewing = !!attempt?.navigation_enabled && active === Number(attempt.active_question_index) && view < active && remaining > Number(attempt?.review_cutoff_seconds ?? 25);
  return {
    questionIndex: reviewing ? view : active,
    activeIndex: active,
    questionRemaining: remaining,
    overallRemaining: Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / 1000)) : null,
    reviewing,
  };
}
