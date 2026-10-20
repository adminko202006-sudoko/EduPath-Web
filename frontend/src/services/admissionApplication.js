const activeStatuses = ['approved', 'under_review', 'pending'];

export function activeAdmissionForPeriod(applications, periodId) {
  if (periodId == null) return null;
  return activeStatuses.map((status) => applications.find((application) =>
    String(application.admission_period_id) === String(periodId) && application.status === status
  )).find(Boolean) || null;
}

export function selectAdmissionForPeriod(applications, periodId) {
  return activeAdmissionForPeriod(applications, periodId)
    || applications.find((application) => periodId != null && String(application.admission_period_id) === String(periodId))
    || applications[0] || null;
}
