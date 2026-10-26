/** Resolve the existing account/applicant photo fields against the API's public storage host. */
export function resolveAccountPhoto(user, serverBaseUrl) {
  const raw = user?.profile_photo_url || (user?.role === 'applicant'
    ? user?.applicant?.profile_photo_url || user?.applicant?.profile_photo
    : user?.profile_photo);
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const path = raw.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(path) && !/^https?:/i.test(path)) return null;
  try {
    const server = new URL(serverBaseUrl);
    const absolute = /^https?:\/\//i.test(path) || path.startsWith('//');
    const relative = path.startsWith('/') ? path : path.startsWith('storage/') ? `/${path}` : `/storage/${path}`;
    const photo = new URL(absolute ? path : relative, server);
    const loopback = host => ['localhost', '127.0.0.1', '[::1]'].includes(host);
    // APP_URL may omit the API server's port, even on the same computer.
    // Resolve Laravel's local public-storage URLs against the active API host.
    if (loopback(photo.hostname) && (photo.pathname.startsWith('/storage/') || !loopback(server.hostname))) {
      photo.protocol = server.protocol;
      photo.host = server.host;
    }
    return photo.href;
  } catch {
    return null;
  }
}
