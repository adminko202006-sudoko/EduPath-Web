import api from './api';

const options = { skipGlobalRefresh: true };
export const onboardingService = {
  get: async () => (await api.get('/applicant/onboarding', options)).data.data,
  save: async (data) => (await api.patch('/applicant/onboarding', data, options)).data.data,
  restart: async (data) => (await api.post('/applicant/onboarding/restart', data, options)).data.data,
};
