// Use record IDs rather than names or email addresses: applicants can share names.
export function groupApplicantDocuments(documents) {
  const groups = new Map();
  for (const document of documents) {
    const application = document.admission_application;
    const applicantId = application?.applicant_id ?? application?.applicant?.id ?? document.applicant?.id;
    const applicationId = document.admission_application_id ?? application?.id;
    // Missing relationships must not combine unrelated applicants into one group.
    const key = applicantId != null ? `applicant-${applicantId}`
      : applicationId != null ? `application-${applicationId}` : `document-${document.id}`;
    if (!groups.has(key)) groups.set(key, { key, documents: [] });
    groups.get(key).documents.push(document);
  }
  return [...groups.values()];
}
