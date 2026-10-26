import axios from 'axios';

import { notifyRefresh } from './refreshBus';
import { createInFlightAdapter } from './inFlightRequests';
import { resolveApiBaseUrl } from './apiBaseUrl';

/**
 * API URL can be overridden in frontend/.env.local:
 * VITE_API_BASE_URL=http://192.168.x.x:8000/api
 *
 * The hostname fallback makes the app work when opened from another device
 * on the same LAN, provided Laravel is listening on 0.0.0.0:8000 and the
 * firewall permits the connection. localhost is intentionally not hardcoded.
 */
export const getApiBaseUrl = () => {
  return resolveApiBaseUrl({
    configured: import.meta.env?.VITE_API_BASE_URL,
    origin: typeof window !== 'undefined' ? window.location?.origin : '',
    hostname: typeof window !== 'undefined' ? window.location?.hostname : '',
    production: import.meta.env?.PROD === true,
  });
};

export const getServerBaseUrl = () => getApiBaseUrl().replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { Accept: 'application/json' },
  timeout: 20000,
});

const transport = axios.getAdapter(api.defaults.adapter);
api.defaults.adapter = createInFlightAdapter(transport, (config) => JSON.stringify([
  api.getUri(config), config.responseType || '', config.timeout, config.withCredentials,
  Object.entries(config.headers?.toJSON?.() || config.headers || {}).sort(([a], [b]) => a.localeCompare(b)),
]));

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

/*
 * After every successful create/update/delete, tell all mounted screens
 * (via the refresh bus) to reload their data — this is what keeps lists,
 * dashboards and detail pages up to date without a manual page refresh.
 * Login/logout/session requests are skipped: they don't drive screen data.
 */
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

api.interceptors.response.use(
  (response) => {
    const method = String(response.config?.method || '').toLowerCase();
    const url = String(response.config?.url || '');
    const status = response.status;

    if (
      MUTATING_METHODS.has(method) &&
      !response.config?.skipGlobalRefresh &&
      !url.startsWith('/auth') &&
      status >= 200 &&
      status < 300
    ) {
      notifyRefresh();
    }

    return response;
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
