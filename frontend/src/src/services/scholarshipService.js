import api, { unwrapCollection } from './api';

export const getScholarships = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/scholarships', config)).data);

export const getScholarship = async (scholarshipId, config = {}) =>
  (await api.get(`/applicant/scholarships/${scholarshipId}`, config)).data;

export const applyForScholarship = async (scholarshipId, payload = {}, config = {}) =>
  (await api.post(`/applicant/scholarships/${scholarshipId}/apply`, payload, config)).data;

export const getMyScholarshipApplications = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/scholarship-applications', config)).data);

export const getMyScholarshipApplication = async (applicationId, config = {}) =>
  (await api.get(`/applicant/scholarship-applications/${applicationId}`, config)).data;

export const getAdminScholarships = async (config = {}) =>
  unwrapCollection((await api.get('/admin/scholarships', config)).data);

export default {
  getScholarships,
  getScholarship,
  applyForScholarship,
  getMyScholarshipApplications,
  getMyScholarshipApplication,
  getAdminScholarships,
};
