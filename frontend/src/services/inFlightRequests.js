// Share only concurrent reads. Completed responses are never cached, so later
// navigation, permission checks, refreshes and examination clocks stay fresh.
export function createInFlightAdapter(transport, requestKey) {
  const pending = new Map();
  return async (config) => {
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get') {
      pending.clear();
      try { return await transport(config); }
      finally { pending.clear(); }
    }
    if (config.signal || config.cancelToken || config.onDownloadProgress || config.paramsSerializer
      || config.dedupe === false || config.url?.includes('/online-exam') || config.url?.includes('/auth/')) {
      return transport(config);
    }

    const key = requestKey(config);
    let request = pending.get(key);
    if (!request) {
      request = Promise.resolve().then(() => transport(config));
      pending.set(key, request);
    }
    try {
      const response = await request;
      return { ...response, config };
    } finally {
      if (pending.get(key) === request) pending.delete(key);
    }
  };
}
