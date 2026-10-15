import axios from 'axios';

/**
 * API URL can be overridden in frontend/.env.local:
 * VITE_API_BASE_URL=http://192.168.x.x:8000/api
 *
 * The hostname fallback makes the app work when opened from another device
 * on the same LAN, provided Laravel is listening on 0.0.0.0:8000 and the
 * firewall permits the connection. localhost is intentionally not hardcoded.
 */
const getApiBaseUrl = () => {
  const configured = import.meta.env?.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000/api`;
  }

  return 'http://127.0.0.1:8000/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { Accept: 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('token')
      : null;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser/Axios set the multipart boundary for FormData.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    } else if (config.data !== undefined && !config.headers?.['Content-Type']) {
      config.headers = config.headers || {};
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export const unwrapCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

export default api;
