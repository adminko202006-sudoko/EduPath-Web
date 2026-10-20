/** Treat Laravel date-only and serialized date timestamps as a calendar date. */
export function parseExamDate(value) {
  const part = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(part)) return null;
  const date = new Date(`${part}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== Number(part.slice(0, 4)) ||
    date.getMonth() + 1 !== Number(part.slice(5, 7)) || date.getDate() !== Number(part.slice(8, 10))) return null;
  return date;
}

export function examDateInput(value) {
  return parseExamDate(value) ? String(value).slice(0, 10) : '';
}

export function isUpcomingScheduledExam(exam, today = new Date()) {
  const date = parseExamDate(exam.exam_date);
  if (!date || !exam.is_active) return false;
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date >= currentDay;
}
