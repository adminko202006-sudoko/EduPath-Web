import api from './api';

const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async getUser(token) {
    const response = await api.get('/auth/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  async logout(token) {
    const response = await api.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },
};

export default authService;
