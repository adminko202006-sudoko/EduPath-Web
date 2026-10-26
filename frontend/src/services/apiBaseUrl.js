export function resolveApiBaseUrl({ configured = '', origin = '', hostname = '', production = false } = {}) {
  const value = configured.trim().replace(/\/+$/, '');
  if (production) {
    // The web and API deployment can share one HTTPS origin.
    const url = new URL(value || '/api', origin || undefined);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('Production API configuration requires an HTTPS address without credentials, query parameters, or fragments.');
    }
    return url.href.replace(/\/+$/, '');
  }
  return value || `http://${hostname || '127.0.0.1'}:8000/api`;
}
