import api from './api';

const requests = new Map();
export function getLocations(path) {
  if (!requests.has(path)) {
    requests.set(path, api.get(`/locations/${path}`).then(({ data }) => {
      if (!Array.isArray(data?.data)) throw new Error('Invalid location response');
      return data.data;
    }).catch((error) => { requests.delete(path); throw error; }));
  }
  return requests.get(path);
}
