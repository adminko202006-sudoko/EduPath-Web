export function isFheScholarship(scholarship) {
  return Boolean(scholarship && /\bFHE\b|free\s+higher\s+education/i.test(`${scholarship.name || ''} ${scholarship.program_type || ''}`));
}

export function needsEntranceExamReview(scholarship) {
  if (!scholarship) return false;
  return scholarship.requires_face_to_face_exam === true
    || scholarship.requires_face_to_face_exam === 1
    || isFheScholarship(scholarship);
}

export function hasRecordedEntranceScore(assignment) {
  const score = assignment?.score;
  return score !== null && score !== undefined && String(score).trim() !== ''
    && Number.isFinite(Number(score));
}

export function summarizeEntranceExamRecords(records) {
  const completed = records.filter(record => record.status === 'completed' && hasRecordedEntranceScore(record));
  return {
    total: records.length,
    completedScored: completed.length,
    releasedScored: completed.filter(record => Boolean(record.entrance_exam?.results_released_at)).length,
  };
}
