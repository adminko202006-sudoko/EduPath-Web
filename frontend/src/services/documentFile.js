import api from './api';

/**
 * Download a private applicant document through the authenticated API and
 * return an object URL usable in an <img>, <a> or window.open().
 *
 * The legacy /storage/... links are served straight off the public disk with
 * no authorization at all, so screens use the role-scoped endpoints
 * (/applicant|/staff|/admin/documents/{id}/file) instead. Ownership and
 * program assignments are enforced by the backend.
 *
 * Callers should revoke the returned URL with URL.revokeObjectURL() once the
 * viewer is closed.
 */
export async function fetchDocumentObjectUrl(apiPath) {
  const response = await api.get(apiPath, { responseType: 'blob' });

  return URL.createObjectURL(response.data);
}

/**
 * Open a private document in a new tab. Throws when the request fails so
 * callers can surface an error message.
 */
export async function openPrivateDocument(apiPath) {
  const url = await fetchDocumentObjectUrl(apiPath);

  window.open(url, '_blank', 'noopener,noreferrer');

  // Give the new tab time to read the blob before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
