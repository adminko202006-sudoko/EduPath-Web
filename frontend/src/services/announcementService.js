import api, { unwrapCollection } from './api';

/**
 * Applicant announcements need a dedicated GET /api/applicant/announcements
 * route in Laravel. The currently supplied backend routes do not define it.
 * Keep this call centralized so the frontend can use it once that route is added.
 */
export const getApplicantAnnouncements = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/announcements', config)).data);

export const getAdminAnnouncements = async (config = {}) =>
  unwrapCollection((await api.get('/admin/announcements', config)).data);

export const createAnnouncement = async (payload, config = {}) =>
  (await api.post('/admin/announcements', payload, config)).data;

export const updateAnnouncement = async (id, payload, config = {}) =>
  (await api.put(`/admin/announcements/${id}`, payload, config)).data;

export const deleteAnnouncement = async (id, config = {}) =>
  (await api.delete(`/admin/announcements/${id}`, config)).data;

export default {
  getApplicantAnnouncements,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
