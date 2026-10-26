/** Classify restoration failures without discarding credentials during an outage. */
export async function restoreSession(token, getUser) {
  if (!token) return { status: 'anonymous', user: null };
  try {
    const response = await getUser(token);
    if (response?.success === false) return { status: 'unavailable', user: null };
    const user = response.data || response.user || response;
    if (!user?.id || !['admin', 'staff', 'applicant'].includes(user.role)) {
      return { status: 'unavailable', user: null };
    }
    return { status: 'authenticated', user };
  } catch (error) {
    // Only the server's unauthenticated response proves that this token expired.
    return { status: error?.response?.status === 401 ? 'expired' : 'unavailable', user: null };
  }
}
