import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('geovision_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on check/me calls to avoid infinite loops
      if (!error.config.url.includes('/auth/me')) {
        localStorage.removeItem('geovision_token');
        localStorage.removeItem('geovision_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
