import api, { unwrapCollection } from './api';

export const getApplicantProfile = async (config = {}) =>
  (await api.get('/applicant/profile', config)).data;
export const updateApplicantProfile = async (payload, config = {}) =>
  (await api.put('/applicant/profile', payload, config)).data;
export const getAdmissionPeriod = async (config = {}) =>
  (await api.get('/applicant/admission-period', config)).data;
export const getAdmissionApplications = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/admissions', config)).data);
export const getAdmissionApplication = async (applicationId, config = {}) =>
  (await api.get(`/applicant/admissions/${applicationId}`, config)).data;
export const submitAdmissionApplication = async (payload, config = {}) =>
  (await api.post('/applicant/admissions', payload, config)).data;
export const getApplicantDocuments = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/documents', config)).data);
export const uploadApplicantDocument = async (payload, config = {}) =>
  (await api.post('/applicant/documents', payload, config)).data;
export const replaceApplicantDocument = async (documentId, payload, config = {}) =>
  (await api.post(`/applicant/documents/${documentId}/replace`, payload, config)).data;
export const getApplicantNotifications = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/notifications', config)).data);
export const markNotificationRead = async (notificationId, config = {}) =>
  (await api.put(`/applicant/notifications/${notificationId}/read`, {}, config)).data;
export const markAllNotificationsRead = async (config = {}) =>
  (await api.put('/applicant/notifications/read-all', {}, config)).data;

export default {
  getApplicantProfile,
  updateApplicantProfile,
  getAdmissionPeriod,
  getAdmissionApplications,
  getAdmissionApplication,
  submitAdmissionApplication,
  getApplicantDocuments,
  uploadApplicantDocument,
  replaceApplicantDocument,
  getApplicantNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
