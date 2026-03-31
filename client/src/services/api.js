import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fb_token');
      // Do not force-reload for auth form failures (invalid credentials, etc.).
      const reqUrl = err.config?.url || '';
      const isAuthRequest = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/signup');
      if (!isAuthRequest && typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
