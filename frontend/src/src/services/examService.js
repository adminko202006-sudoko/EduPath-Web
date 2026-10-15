import api, { unwrapCollection } from './api';

export const getApplicantExams = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/exams', config)).data);

export const getApplicantExam = async (assignmentId, config = {}) =>
  (await api.get(`/applicant/exams/${assignmentId}`, config)).data;

export const getStaffExams = async (config = {}) =>
  unwrapCollection((await api.get('/staff/exams', config)).data);

export default { getApplicantExams, getApplicantExam, getStaffExams };
