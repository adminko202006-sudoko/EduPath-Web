import api from './api';
import { unwrapCollection } from './api';

export const getApplicantPrograms = async (config = {}) =>
  unwrapCollection((await api.get('/applicant/programs', config)).data);

export const getProgramRequirements = async (programId, config = {}) =>
  unwrapCollection((await api.get(`/applicant/programs/${programId}/requirements`, config)).data);

export const getPublicPrograms = async (config = {}) =>
  unwrapCollection((await api.get('/programs', config)).data);

export default { getApplicantPrograms, getProgramRequirements, getPublicPrograms };
